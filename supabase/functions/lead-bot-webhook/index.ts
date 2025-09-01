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
    const webhook = await req.json();
    console.log('Lead Bot Webhook received:', JSON.stringify(webhook, null, 2));

    // Log do webhook para auditoria
    await supabase.from('webhook_logs').insert({
      webhook_type: 'lead_bot_webhook',
      payload: webhook,
      processed: false
    });

    // Processar diferentes tipos de eventos do BOT DE LEADS
    if (webhook.messages && webhook.messages.length > 0) {
      for (const message of webhook.messages) {
        await processLeadBotMessage(message, webhook);
      }
    }

    // Processar status de mensagens (entregue, lida, etc.)
    if (webhook.statuses && webhook.statuses.length > 0) {
      for (const status of webhook.statuses) {
        await processLeadBotStatus(status);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook do Lead Bot:', error);

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'lead-bot-webhook',
      message: 'Erro ao processar webhook',
      data: { error: error.message }
    });

    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processLeadBotMessage(message: any, webhook: any) {
  try {
    console.log('Processando mensagem do Lead Bot:', message);

    // Se é uma resposta de um vendedor ao BOT DE LEADS
    if (message.type === 'text' && !message.from_me) {
      const vendorPhone = message.from;
      const messageText = message.text?.body || '';

      // Buscar o vendedor pelo telefone
      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('phone_number', vendorPhone)
        .single();

      if (vendor) {
        // Registrar resposta do vendedor
        await supabase.from('system_logs').insert({
          level: 'info',
          source: 'lead-bot-webhook',
          message: 'Vendedor respondeu ao BOT DE LEADS',
          data: {
            vendor_id: vendor.id,
            vendor_name: vendor.name,
            message_text: messageText,
            whapi_message_id: message.id
          }
        });

        // Aqui você pode implementar lógica adicional:
        // - Marcar lead como "em andamento"
        // - Notificar sistema sobre interesse do vendedor
        // - Atualizar status na tabela lead_distributions
        
        // Atualizar status da distribuição se for uma resposta relacionada
        const { data: distribution } = await supabase
          .from('lead_distributions')
          .select('*')
          .eq('vendor_id', vendor.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        if (distribution) {
          await supabase
            .from('lead_distributions')
            .update({
              status: 'responded',
              metadata: {
                ...distribution.metadata,
                response_message: messageText,
                response_at: new Date().toISOString()
              }
            })
            .eq('id', distribution.id);
        }
      }
    }

  } catch (error) {
    console.error('Erro ao processar mensagem do Lead Bot:', error);
  }
}

async function processLeadBotStatus(status: any) {
  try {
    console.log('Status atualizado:', {
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp
    });

    // Atualizar status na tabela lead_distributions
    const { data: distribution } = await supabase
      .from('lead_distributions')
      .select('*')
      .contains('metadata', { whapi_message_id: status.id })
      .single();

    if (distribution) {
      const updatedMetadata = {
        ...distribution.metadata,
        delivery_status: status.status,
        status_updated_at: new Date().toISOString()
      };

      await supabase
        .from('lead_distributions')
        .update({ metadata: updatedMetadata })
        .eq('id', distribution.id);

      console.log(`Status ${status.status} atualizado para distribuição ${distribution.id}`);
    }

  } catch (error) {
    console.error('Erro ao processar status:', error);
  }
}