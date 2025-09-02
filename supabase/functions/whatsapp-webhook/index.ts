import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with service role
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const WEBHOOK_VERIFY_TOKEN = 'DRYSTORE_WEBHOOK_2024';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // GET request for webhook verification
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        return new Response(challenge, { status: 200 });
      } else {
        console.log('Webhook verification failed');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // POST request for receiving messages
    if (req.method === 'POST') {
      const body = await req.json();
      
      // Log webhook for debugging
      await supabase.from('webhook_logs').insert({
        webhook_type: 'message',
        payload: body,
        processed: false
      });

      // Process webhook payload
      if (body.entry?.[0]?.changes?.[0]) {
        const change = body.entry[0].changes[0];
        
        if (change.field === 'messages') {
          const messageData = change.value;
          
          // Handle incoming messages
          if (messageData.messages?.[0]) {
            for (const message of messageData.messages) {
              const conversationId = await handleIncomingMessage(message, messageData.contacts?.[0]);
              
              // Trigger lead scoring após processar mensagem
              if (conversationId) {
                try {
                  await supabase.functions.invoke('score-lead-temperature', {
                    body: { conversationId }
                  });
                } catch (error) {
                  console.error('Erro ao executar scoring de leads:', error);
                }
              }
            }
          }

          // Handle status updates
          if (messageData.statuses?.[0]) {
            for (const status of messageData.statuses) {
              await handleStatusUpdate(status);
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Log error to database
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'whatsapp-webhook',
      message: 'Webhook processing failed',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleIncomingMessage(message: any, contact: any) {
  const { from, id: whatsappMessageId, type, timestamp } = message;
  
  try {
    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('whatsapp_number', from)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          whatsapp_number: from,
          whatsapp_name: contact?.profile?.name || contact?.wa_id || from,
          customer_name: contact?.profile?.name || contact?.wa_id || from, // Set customer_name same as whatsapp_name
          profile_pic_url: contact?.profile?.picture || null,
          status: 'in_bot',
          source: 'whatsapp', // Mark as real WhatsApp conversation
          first_message_at: new Date(parseInt(timestamp) * 1000).toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
      }
      conversation = newConv;
    }

    // Extract message content based on type
    let content = '';
    let mediaUrl = null;
    let mediaType = null;

    if (type === 'text') {
      content = message.text.body;
    } else if (type === 'interactive') {
      if (message.interactive.type === 'button_reply') {
        content = message.interactive.button_reply.title;
      } else if (message.interactive.type === 'list_reply') {
        content = message.interactive.list_reply.title;
      }
    } else if (['image', 'audio', 'video', 'document', 'sticker'].includes(type)) {
      // Para mídia, baixar e armazenar o arquivo
      const mediaInfo = message[type];
      if (mediaInfo?.id) {
        console.log(`Processing media: ${type}, ID: ${mediaInfo.id}`);
        
        try {
          // Chamar função para baixar mídia
          const { data: downloadData, error: downloadError } = await supabase.functions.invoke('download-whatsapp-media', {
            body: {
              mediaId: mediaInfo.id,
              mediaType: mediaInfo.mime_type || type
            }
          });

          if (downloadError) {
            console.error('Error downloading media:', downloadError);
            content = `[ERRO AO BAIXAR ${type.toUpperCase()}]`;
          } else if (downloadData?.success) {
            content = mediaInfo.caption || `[${type.toUpperCase()}]`;
            mediaUrl = downloadData.publicUrl;
            mediaType = downloadData.mimeType;
            console.log(`Media downloaded successfully: ${mediaUrl}`);
          } else {
            console.error('Failed to download media:', downloadData);
            content = `[ERRO AO PROCESSAR ${type.toUpperCase()}]`;
          }
        } catch (error) {
          console.error('Exception downloading media:', error);
          content = `[ERRO AO BAIXAR ${type.toUpperCase()}]`;
        }
      } else {
        content = `[${type.toUpperCase()} SEM ID]`;
      }
    } else {
      content = `[TIPO DE MENSAGEM NÃO SUPORTADO: ${type}]`;
    }

    // Save message
    const { data: savedMessage, error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      whatsapp_message_id: whatsappMessageId,
      sender_type: 'customer',
      content,
      media_type: mediaType,
      media_url: mediaUrl,
      status: 'delivered',
      transcription_status: (type === 'audio' || type === 'voice') ? 'pending' : 'not_applicable',
      created_at: new Date(parseInt(timestamp) * 1000).toISOString()
    }).select().single();

    if (messageError) {
      throw new Error(`Failed to save message: ${messageError.message}`);
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        status: 'in_bot'
      })
      .eq('id', conversation.id);

    // Chamar transcrição para mensagens de áudio de forma assíncrona
    if ((type === 'audio' || type === 'voice') && mediaUrl && savedMessage?.id) {
      console.log(`🎵 Starting audio transcription for message ${savedMessage.id}`);
      
      // Chamar função de transcrição assíncrona sem bloquear
      supabase.functions.invoke('transcribe-audio', {
        body: {
          message_id: savedMessage.id,
          media_url: mediaUrl
        }
      }).then(result => {
        if (result.error) {
          console.error('Transcription failed:', result.error);
        } else {
          console.log('Transcription completed successfully');
        }
      }).catch(error => {
        console.error('Transcription exception:', error);
      });
    }

    // PROCESSAR MENSAGEM COM AGENTES DE IA (SKIP PARA ÁUDIO ATÉ TRANSCRIÇÃO COMPLETAR)
    if (type !== 'audio' && type !== 'voice') {
      await processMessageWithAI(conversation.id, content);
    } else {
      console.log(`🎵 Audio message - waiting for transcription before AI processing`);
    }

    // Log para debug
    console.log('Message processed with AI agents:', {
      conversationId: conversation.id,
      messageId: whatsappMessageId,
      content: content.substring(0, 50)
    });

    return conversation.id;

  } catch (error) {
    console.error('Error handling incoming message:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'whatsapp-webhook',
      message: 'Failed to handle incoming message',
      data: { 
        error: error.message,
        whatsappMessageId,
        from
      }
    });
  }
}

// Função para processar mensagem imediatamente com agentes de IA
async function processMessageWithAI(conversationId: string, messageContent: string) {
  try {
    console.log(`🤖 Processing message with AI agents for conversation: ${conversationId}`);

    // 1. Classificar a intenção da mensagem
    console.log('Step 1: Classifying intent...');
    const { data: classificationResult, error: classifyError } = await supabase.functions.invoke('classify-intent-llm', {
      body: {
        conversationId,
        message: messageContent
      }
    });

    if (classifyError) {
      console.error('Classification failed:', classifyError);
    } else {
      console.log('Classification result:', classificationResult);
      
      // Atualizar product_group da conversa e fazer handoff automático se classificação foi bem-sucedida
      if (classificationResult?.productGroup && classificationResult.productGroup !== 'indefinido') {
        try {
          const { data: currentConversation } = await supabase
            .from('conversations')
            .select('product_group, current_agent_id')
            .eq('id', conversationId)
            .single();
            
          // VERIFICAR LOCK DE CATEGORIA ANTES DE ATUALIZAR
          const SPECIFIC_CATEGORIES = ['ferramentas', 'telha_shingle', 'energia_solar', 'steel_frame', 'drywall_divisorias', 'pisos', 'acabamentos', 'forros'];
          
          // Se categoria atual é específica, não permitir mudança
          if (currentConversation.product_group && SPECIFIC_CATEGORIES.includes(currentConversation.product_group)) {
            console.log(`🔒 Category update blocked: ${currentConversation.product_group} is locked and cannot be changed to ${classificationResult.productGroup}`);
            
            // Log da tentativa bloqueada
            await supabase.from('system_logs').insert({
              level: 'info',
              source: 'whatsapp-webhook-category-lock',
              message: 'Category change blocked by lock system',
              data: { 
                conversationId,
                currentCategory: currentConversation.product_group,
                attemptedCategory: classificationResult.productGroup,
                message: messageContent,
                classificationResult
              }
            });
          }
          // Só atualizar se houve mudança de categoria E categoria atual não é específica
          else if (currentConversation && currentConversation.product_group !== classificationResult.productGroup) {
            console.log(`🔄 Updating conversation category: ${currentConversation.product_group} → ${classificationResult.productGroup}`);
            
            // Buscar agente especialista para nova categoria
            const newAgentId = await performAgentHandoff(conversationId, classificationResult.productGroup, currentConversation.current_agent_id);
            
            await supabase
              .from('conversations')
              .update({
                product_group: classificationResult.productGroup,
                classification_updated_at: new Date().toISOString(),
                confidence_score: classificationResult.confidence || 0,
                current_agent_id: newAgentId
              })
              .eq('id', conversationId);
              
            // Log da mudança de classificação
            await supabase.from('classification_history').insert({
              conversation_id: conversationId,
              old_product_group: currentConversation.product_group,
              new_product_group: classificationResult.productGroup,
              confidence_score: classificationResult.confidence || 0,
              analysis_data: { 
                classification_result: classificationResult,
                message: messageContent,
                old_agent_id: currentConversation.current_agent_id,
                new_agent_id: newAgentId
              }
            });
            
            console.log(`✅ Conversation category updated and agent handoff completed`);
          }
        } catch (updateError) {
          console.error('Error updating conversation category:', updateError);
        }
      }
    }

    // 2. Extrair dados do cliente
    console.log('Step 2: Extracting customer data...');
    const { data: extractionResult, error: extractError } = await supabase.functions.invoke('extract-customer-data', {
      body: {
        conversationId,
        message: messageContent
      }
    });

    if (extractError) {
      console.error('Extraction failed:', extractError);
    } else {
      console.log('Extraction result:', extractionResult);
    }

    // 3. Gerar resposta inteligente usando agentes de IA
    console.log('Step 3: Generating intelligent response...');
    const { data: responseResult, error: responseError } = await supabase.functions.invoke('intelligent-agent-response', {
      body: {
        conversationId,
        message: messageContent,
        productCategory: classificationResult?.productGroup || 'indefinido'
      }
    });

    if (responseError) {
      console.error('Response generation failed:', responseError);
      
      // Fallback: usar agente geral se falhar
      const { data: fallbackResult } = await supabase.functions.invoke('intelligent-agent-response', {
        body: {
          conversationId,
          message: messageContent,
          productCategory: 'indefinido'
        }
      });
      
      console.log('Fallback response:', fallbackResult);
      
      if (fallbackResult?.response) {
        await sendWhatsAppResponse(conversationId, fallbackResult.response);
      }
    } else {
      console.log('AI Response generated:', responseResult);
      
      if (responseResult?.response) {
        await sendWhatsAppResponse(conversationId, responseResult.response);
      }
    }

  } catch (error) {
    console.error('Error processing message with AI:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'whatsapp-webhook-ai-processing',
      message: 'Failed to process message with AI',
      data: { error: error.message, conversationId }
    });

    // Como último recurso, enviar mensagem de fallback usando agente geral
    try {
      const { data: emergencyResponse } = await supabase.functions.invoke('intelligent-agent-response', {
        body: {
          conversationId,
          message: "Mensagem de fallback - houve um erro no processamento",
          productCategory: 'indefinido'
        }
      });
      
      if (emergencyResponse?.response) {
        await sendWhatsAppResponse(conversationId, emergencyResponse.response);
      }
    } catch (emergencyError) {
      console.error('Emergency response also failed:', emergencyError);
    }
  }
}

// Função para enviar resposta via WhatsApp
async function sendWhatsAppResponse(conversationId: string, response: string) {
  try {
    // Buscar dados da conversa
    const { data: conversation } = await supabase
      .from('conversations')
      .select('whatsapp_number')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Enviar mensagem via WhatsApp
    const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        to: conversation.whatsapp_number,
        message: response
      }
    });

    if (sendError) {
      console.error('Failed to send WhatsApp message:', sendError);
    } else {
      console.log('WhatsApp message sent successfully:', sendResult);
    }

  } catch (error) {
    console.error('Error sending WhatsApp response:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'whatsapp-webhook-send-response',
      message: 'Failed to send WhatsApp response',
      data: { error: error.message, conversationId, response: response.substring(0, 100) }
    });
  }
}

async function handleStatusUpdate(status: any) {
  const { id, status: messageStatus, timestamp } = status;
  
  try {
    // Map WhatsApp status to our enum
    const statusMap: Record<string, string> = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed'
    };

    const mappedStatus = statusMap[messageStatus] || messageStatus;
    const statusTimestamp = new Date(parseInt(timestamp) * 1000).toISOString();

    // Update message status - fix column name issue
    const updateData: any = { status: mappedStatus };
    
    // Only add timestamp fields that exist in the schema
    if (messageStatus === 'delivered') {
      updateData.delivered_at = statusTimestamp;
    } else if (messageStatus === 'read') {
      updateData.read_at = statusTimestamp;
    }

    const { error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('whatsapp_message_id', id);

    if (error) {
      throw new Error(`Failed to update message status: ${error.message}`);
    }

    console.log('Status updated:', { messageId: id, status: mappedStatus });

  } catch (error) {
    console.error('Error handling status update:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'whatsapp-webhook',
      message: 'Failed to handle status update',
      data: { 
        error: error.message,
        messageId: id,
        status: messageStatus
      }
    });
  }
}

// Função para realizar handoff automático de agente
async function performAgentHandoff(conversationId: string, newCategory: string, currentAgentId: string | null): Promise<string> {
  try {
    console.log(`🔄 Performing agent handoff for category: ${newCategory}`);
    
    // Buscar agente especialista para a nova categoria
    let { data: specialistAgent } = await supabase
      .from('agent_configs')
      .select('id, agent_name, agent_type, product_category')
      .eq('agent_type', 'specialist')
      .eq('product_category', newCategory)
      .eq('is_active', true)
      .single();
    
    let newAgentId = currentAgentId;
    
    if (specialistAgent) {
      newAgentId = specialistAgent.id;
      console.log(`🎯 Found specialist agent: ${specialistAgent.agent_name} for category: ${newCategory}`);
    } else {
      // Se não há especialista, usar agente geral
      const { data: generalAgent } = await supabase
        .from('agent_configs')
        .select('id, agent_name, agent_type')
        .eq('agent_type', 'general')
        .eq('is_active', true)
        .single();
      
      if (generalAgent) {
        newAgentId = generalAgent.id;
        console.log(`📞 Using general agent: ${generalAgent.agent_name} (no specialist found for ${newCategory})`);
      }
    }
    
    // Log do handoff se houve mudança de agente
    if (newAgentId !== currentAgentId) {
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'whatsapp-webhook-handoff',
        message: 'Automatic agent handoff performed',
        data: {
          conversation_id: conversationId,
          old_agent_id: currentAgentId,
          new_agent_id: newAgentId,
          category: newCategory,
          specialist_found: !!specialistAgent
        }
      });
      
      console.log(`✅ Agent handoff completed: ${currentAgentId || 'none'} → ${newAgentId}`);
    }
    
    return newAgentId || currentAgentId || '';
    
  } catch (error) {
    console.error('Error performing agent handoff:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'whatsapp-webhook-handoff',
      message: 'Agent handoff failed',
      data: { 
        error: error.message,
        conversation_id: conversationId,
        category: newCategory
      }
    });
    
    // Retornar agente atual em caso de erro
    return currentAgentId || '';
  }
}