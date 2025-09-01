import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, vendorId, summary, sentByAgentId } = await req.json();

    if (!conversationId || !vendorId || !summary) {
      return new Response(
        JSON.stringify({ error: 'conversationId, vendorId e summary são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar configuração do bot de leads
    const leadBotToken = Deno.env.get('LEAD_BOT_WHAPI_TOKEN');
    
    if (!leadBotToken || leadBotToken === 'TOKEN_PLACEHOLDER') {
      return new Response(
        JSON.stringify({ error: 'Token do Bot de Leads não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar dados do vendedor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return new Response(
        JSON.stringify({ error: 'Vendedor não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar dados da conversa para contexto
    const { data: conversation } = await supabase
      .from('conversations')
      .select('customer_name, whatsapp_number')
      .eq('id', conversationId)
      .single();

    // 4. Preparar mensagem para o vendedor
    const messageHeader = `🚀 **NOVO LEAD** - ${conversation?.customer_name || 'Cliente'}\n`;
    const messageFooter = `\n---\n📱 WhatsApp do cliente: ${conversation?.whatsapp_number}\n⏰ Enviado em: ${new Date().toLocaleString('pt-BR')}`;
    
    const fullMessage = messageHeader + summary + messageFooter;

    // 5. Enviar mensagem via Whapi usando o BOT DE LEADS
    const whapiResponse = await fetch(`https://gate.whapi.cloud/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leadBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: vendor.phone_number,
        body: fullMessage
      }),
    });

    const whapiData = await whapiResponse.json();

    if (!whapiResponse.ok) {
      throw new Error(`Erro na Whapi: ${whapiData.message || 'Erro desconhecido'}`);
    }

    // 6. Registrar distribuição na tabela
    const { data: distribution, error: distError } = await supabase
      .from('lead_distributions')
      .insert({
        conversation_id: conversationId,
        vendor_id: vendorId,
        summary_text: summary,
        sent_by_agent_id: sentByAgentId,
        status: 'sent',
        metadata: {
          whapi_message_id: whapiData.id,
          vendor_phone: vendor.phone_number,
          bot_used: 'BOT DE LEADS'
        }
      })
      .select()
      .single();

    if (distError) {
      console.error('Erro ao registrar distribuição:', distError);
    }

    // 7. Log do envio
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'send-lead-to-vendor',
      message: 'Lead enviado com sucesso',
      data: {
        conversation_id: conversationId,
        vendor_id: vendorId,
        vendor_name: vendor.name,
        whapi_message_id: whapiData.id,
        distribution_id: distribution?.id
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lead enviado com sucesso',
        distributionId: distribution?.id,
        whapiMessageId: whapiData.id,
        vendorName: vendor.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao enviar lead:', error);

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'send-lead-to-vendor',
      message: 'Erro ao enviar lead',
      data: { error: error.message }
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});