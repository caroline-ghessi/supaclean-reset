import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();
    
    console.log(`Processing message buffer for conversation: ${conversationId}`);

    // IMPLEMENTAÇÃO DE LOCK ATÔMICO
    // Tentar marcar buffer como "em processamento" de forma atômica
    const now = new Date();
    
    const { data: buffer, error: bufferError } = await supabase
      .from('message_buffers')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('processed', false)
      .is('processing_started_at', null)  // Não está sendo processado por outra instância
      .single();

    if (bufferError || !buffer) {
      console.log('No active buffer found, already processed, or being processed by another instance');
      return new Response(JSON.stringify({ 
        processed: false, 
        reason: 'no_buffer_or_already_processing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se já passou tempo suficiente
    const shouldProcessAt = new Date(buffer.should_process_at);
    
    if (now < shouldProcessAt) {
      console.log('Buffer still within waiting period');
      return new Response(JSON.stringify({ 
        processed: false, 
        waiting: true,
        remaining_seconds: Math.ceil((shouldProcessAt.getTime() - now.getTime()) / 1000)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // LOCK ATÔMICO: Marcar como "processando" antes de continuar
    const { error: lockError } = await supabase
      .from('message_buffers')
      .update({
        processing_started_at: now.toISOString()
      })
      .eq('id', buffer.id)
      .is('processing_started_at', null);  // Só atualiza se ainda não está sendo processado

    if (lockError) {
      console.log('Failed to acquire lock - another instance is processing this buffer');
      return new Response(JSON.stringify({ 
        processed: false, 
        reason: 'lock_failed' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully acquired lock for buffer ${buffer.id}`);

    // Verificar novamente se o buffer ainda existe e não foi processado
    const { data: lockedBuffer, error: verifyError } = await supabase
      .from('message_buffers')
      .select('*')
      .eq('id', buffer.id)
      .eq('processed', false)
      .single();

    if (verifyError || !lockedBuffer) {
      console.log('Buffer was processed by another instance after lock');
      return new Response(JSON.stringify({ 
        processed: false, 
        reason: 'processed_by_another_instance' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Agrupar todas as mensagens do buffer
    const messages = lockedBuffer.messages || [];
    const combinedMessage = messages.map(msg => msg.content).join(' ');

    console.log(`Processing combined message for buffer ${lockedBuffer.id}: ${combinedMessage}`);

    // Buscar dados da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Classificar intenção usando LLM
    const classificationResult = await supabase.functions.invoke('classify-intent-llm', {
      body: {
        message: combinedMessage,
        currentProductGroup: conversation.product_group,
        conversationId
      }
    });

    // Extrair dados do cliente em paralelo
    const extractionResult = await supabase.functions.invoke('extract-customer-data', {
      body: {
        conversationId,
        newMessage: combinedMessage
      }
    });

    let newProductGroup = conversation.product_group;
    
    if (classificationResult.data?.productGroup) {
      // APLICAR LOCK DE CATEGORIA NO PROCESSAMENTO EM LOTE
      const SPECIFIC_CATEGORIES = ['ferramentas', 'telha_shingle', 'energia_solar', 'steel_frame', 'drywall_divisorias', 'pisos', 'acabamentos', 'forros'];
      
      // Verificar se categoria atual é específica (bloqueada)
      if (conversation.product_group && SPECIFIC_CATEGORIES.includes(conversation.product_group)) {
        console.log(`🔒 Buffer processing category update blocked: ${conversation.product_group} is locked`);
        newProductGroup = conversation.product_group; // Manter categoria atual
        
        // Log da tentativa bloqueada
        await supabase.from('system_logs').insert({
          level: 'info',
          source: 'process-message-buffer-category-lock',
          message: 'Buffer processing category change blocked by lock system',
          data: { 
            conversationId,
            currentCategory: conversation.product_group,
            attemptedCategory: classificationResult.data.productGroup,
            combinedMessage,
            classificationResult: classificationResult.data
          }
        });
      } else {
        newProductGroup = classificationResult.data.productGroup;
        
        // Atualizar product_group na conversa se mudou
        if (newProductGroup !== conversation.product_group) {
          await supabase
            .from('conversations')
            .update({ product_group: newProductGroup })
            .eq('id', conversationId);
        }
      }
    }

    // Gerar resposta usando APENAS o sistema de agentes inteligentes
    console.log(`Calling intelligent-agent-response for conversation ${conversationId}`);
    
    const agentResponse = await supabase.functions.invoke('intelligent-agent-response', {
      body: {
        message: combinedMessage,
        conversationId,
        productCategory: newProductGroup
      }
    });

    if (!agentResponse.data?.response) {
      console.error('No response from intelligent-agent-response:', agentResponse.error);
      throw new Error('Failed to get response from intelligent agent');
    }

    const botResponse = {
      text: agentResponse.data.response,
      transferToHuman: agentResponse.data.transferToHuman || false
    };

    console.log(`Generated response: ${botResponse.text.substring(0, 100)}...`);

    // Verificar se já existe uma mensagem idêntica (proteção contra duplicatas)
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('content', botResponse.text)
      .eq('sender_type', 'bot')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Últimos 5 minutos
      .single();

    if (existingMessage) {
      console.log('Identical message already exists, skipping duplicate');
      
      // Marcar buffer como processado mesmo assim
      await supabase
        .from('message_buffers')
        .update({
          processed: true,
          processed_at: now.toISOString()
        })
        .eq('id', lockedBuffer.id);

      return new Response(JSON.stringify({ 
        processed: true,
        skipped_duplicate: true,
        productGroup: newProductGroup
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Salvar resposta do bot
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: botResponse.text,
        sender_type: 'bot',
        status: 'sent'
      });

    if (insertError) {
      console.error('Error saving bot message:', insertError);
      throw new Error('Failed to save bot message');
    }

    console.log(`Sending WhatsApp message to ${conversation.whatsapp_number}`);

    // Enviar mensagem via WhatsApp
    const whatsappResult = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        to: conversation.whatsapp_number,
        message: botResponse.text
      }
    });

    if (whatsappResult.error) {
      console.error('Error sending WhatsApp message:', whatsappResult.error);
      // Não falhar aqui, mensagem já foi salva
    }

    // Atualizar status da conversa e marcar buffer como processado
    const updateData: any = {
      last_message_at: now.toISOString()
    };

    if (botResponse.transferToHuman) {
      updateData.status = 'transferred_to_human';
    }

    await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    // FINALMENTE marcar buffer como processado
    await supabase
      .from('message_buffers')
      .update({
        processed: true,
        processed_at: now.toISOString()
      })
      .eq('id', lockedBuffer.id);

    console.log(`Successfully processed buffer ${lockedBuffer.id} for conversation ${conversationId}`);

    return new Response(JSON.stringify({ 
      processed: true,
      productGroup: newProductGroup,
      responseText: botResponse.text
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing message buffer:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'process-message-buffer',
      message: 'Failed to process message buffer',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// TODAS AS MENSAGENS HARDCODED FORAM REMOVIDAS
// APENAS o intelligent-agent-response é usado para gerar respostas dinâmicas