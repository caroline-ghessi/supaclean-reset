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

    // Agendar processamento do buffer usando setTimeout como fallback
    // Em ambiente de produção, seria melhor usar um sistema de filas dedicado
    console.log(`Scheduling buffer processing for conversation ${conversationId} in 60 seconds`);
    
    // Usar EdgeRuntime.waitUntil para agendar o processamento do buffer
    const processBufferTask = async () => {
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 segundos
      
      try {
        console.log(`Processing buffer for conversation ${conversationId}`);
        
        const result = await supabase.functions.invoke('process-message-buffer', {
          body: { conversationId }
        });
        
        if (result.error) {
          console.error('Error processing buffer:', result.error);
          await supabase.from('system_logs').insert({
            level: 'error',
            source: 'process-whatsapp-message-scheduler',
            message: 'Failed to process buffer',
            data: { 
              conversationId, 
              error: result.error.message,
              scheduled_at: shouldProcessAt.toISOString()
            }
          });
        } else {
          console.log(`Buffer processed successfully for conversation ${conversationId}:`, result.data);
        }
      } catch (error) {
        console.error('Error in scheduled buffer processing:', error);
        await supabase.from('system_logs').insert({
          level: 'error',
          source: 'process-whatsapp-message-scheduler',
          message: 'Exception in scheduled buffer processing',
          data: { 
            conversationId, 
            error: error.message,
            scheduled_at: shouldProcessAt.toISOString()
          }
        });
      }
    };

    // Executar o agendamento em background
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processBufferTask());
    } else {
      // Fallback para ambiente de desenvolvimento
      processBufferTask().catch(error => 
        console.error('Error in background buffer processing:', error)
     );
    }

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