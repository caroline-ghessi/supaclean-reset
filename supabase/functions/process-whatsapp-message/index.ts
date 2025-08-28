import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, whatsappNumber } = await req.json();

    if (!conversationId || !message || !whatsappNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received message for conversation ${conversationId}: ${message}`);

    // Este edge function agora apenas cria/atualiza o buffer de mensagens
    // O processamento real é feito pelo process-message-buffer após 60 segundos

    const bufferTime = 60; // 60 segundos de buffer
    const now = new Date();
    const shouldProcessAt = new Date(now.getTime() + bufferTime * 1000);

    // Buscar buffer existente ou criar novo
    const { data: existingBuffer } = await supabase
      .from('message_buffers')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('processed', false)
      .single();

    if (existingBuffer) {
      // Atualizar buffer existente com nova mensagem
      const currentMessages = existingBuffer.messages || [];
      const updatedMessages = [
        ...currentMessages,
        {
          content: message,
          timestamp: now.toISOString(),
          sender_type: 'customer'
        }
      ];

      await supabase
        .from('message_buffers')
        .update({
          messages: updatedMessages,
          last_message_at: now.toISOString(),
          should_process_at: shouldProcessAt.toISOString() // Resetar timer
        })
        .eq('id', existingBuffer.id);

      console.log(`Updated existing buffer ${existingBuffer.id} with new message`);
    } else {
      // Criar novo buffer
      const { data: newBuffer, error: bufferError } = await supabase
        .from('message_buffers')
        .insert({
          conversation_id: conversationId,
          messages: [{
            content: message,
            timestamp: now.toISOString(),
            sender_type: 'customer'
          }],
          created_at: now.toISOString(),
          last_message_at: now.toISOString(),
          should_process_at: shouldProcessAt.toISOString(),
          processed: false
        })
        .select()
        .single();

      if (bufferError) {
        throw new Error(`Failed to create buffer: ${bufferError.message}`);
      }

      console.log(`Created new buffer ${newBuffer.id} for conversation ${conversationId}`);
    }

    // Salvar mensagem do cliente imediatamente
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: message,
        sender_type: 'customer',
        status: 'delivered'
      });

    // Agendar processamento usando pg_cron
    // Isso substitui o setTimeout que não é confiável em edge functions
    await scheduleBufferProcessing(conversationId, shouldProcessAt);

    console.log(`Message buffered for conversation ${conversationId}, will process at ${shouldProcessAt.toISOString()}`);

    return new Response(JSON.stringify({ 
      success: true, 
      buffered: true,
      will_process_at: shouldProcessAt.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'process-whatsapp-message',
      message: 'Failed to process message',
      data: { error: error.message }
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scheduleBufferProcessing(conversationId: string, processAt: Date) {
  try {
    // Usar pg_cron para agendar o processamento do buffer
    // Criar um job único para este buffer
    const jobName = `process_buffer_${conversationId}_${Date.now()}`;
    const cronExpression = convertDateToCron(processAt);
    
    const { error } = await supabase.rpc('schedule_buffer_processing', {
      job_name: jobName,
      cron_expression: cronExpression,
      conversation_id_param: conversationId
    });

    if (error) {
      console.error('Failed to schedule buffer processing:', error);
      // Fallback: chamar diretamente após delay (não ideal mas funciona)
      setTimeout(async () => {
        await supabase.functions.invoke('process-message-buffer', {
          body: { conversationId }
        });
      }, 60000);
    }
  } catch (error) {
    console.error('Error scheduling buffer processing:', error);
    // Fallback similar ao acima
    setTimeout(async () => {
      await supabase.functions.invoke('process-message-buffer', {
        body: { conversationId }
      });
    }, 60000);
  }
}

function convertDateToCron(date: Date): string {
  // Converter data para expressão cron
  // Formato: minuto hora dia mês dia_da_semana
  const minute = date.getMinutes();
  const hour = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  
  return `${minute} ${hour} ${day} ${month} *`;
}