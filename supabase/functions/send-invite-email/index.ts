import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  displayName: string;
  department?: string;
  role: 'admin' | 'supervisor' | 'atendente';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurado');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const resend = new Resend(resendApiKey);
    
    const { email, displayName, department, role }: InviteRequest = await req.json();

    console.log('Processando convite para:', { email, displayName, role });

    // Determinar URL de redirecionamento
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/set-password`;

    console.log('URL de redirecionamento:', redirectUrl);

    // Criar convite no Supabase Auth
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          display_name: displayName,
          department: department || '',
          invited_role: role
        },
        redirectTo: redirectUrl
      }
    );

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError);
      throw new Error(`Erro ao criar convite: ${inviteError.message}`);
    }

    console.log('Convite criado com sucesso:', inviteData);

    // Enviar email personalizado via Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Convite para DryStore AI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DryStore AI</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistema Inteligente de Atendimento</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${displayName}!</h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Você foi convidado(a) para fazer parte da equipe do <strong>DryStore AI</strong> como <strong>${role}</strong>.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            Para aceitar o convite e configurar sua conta, clique no botão abaixo:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${supabaseUrl}/auth/v1/verify?token=${inviteData.user?.email_confirmation_token}&type=invite&redirect_to=${redirectUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
              Aceitar Convite e Configurar Senha
            </a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
            <h3 style="color: #555; margin-top: 0;">Detalhes do seu acesso:</h3>
            <ul style="color: #666;">
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Cargo:</strong> ${role}</li>
              ${department ? `<li><strong>Departamento:</strong> ${department}</li>` : ''}
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            <strong>Importante:</strong> Este link é válido por 24 horas. Após aceitar o convite, você poderá definir sua senha e acessar o sistema.
          </p>
          
          <p style="font-size: 14px; color: #666;">
            Se você não solicitou este convite, pode ignorar este email com segurança.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            DryStore AI - Sistema Inteligente de Atendimento<br>
            Este é um email automático, não responda.
          </p>
        </body>
      </html>
    `;

    const emailResult = await resend.emails.send({
      from: 'DryStore AI <no-reply@resend.dev>',
      to: [email],
      subject: `Convite para DryStore AI - ${role}`,
      html: emailHtml,
    });

    console.log('Email enviado com sucesso:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso',
        inviteId: inviteData.user?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro no send-invite-email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);