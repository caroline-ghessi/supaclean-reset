import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestData: any = null;
  try {
    requestData = await req.json();
    const { message_id, media_url } = requestData;
    
    if (!message_id || !media_url) {
      throw new Error('message_id and media_url are required');
    }

    console.log(`Starting transcription for message ${message_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to pending
    await supabase
      .from('messages')
      .update({ transcription_status: 'pending' })
      .eq('id', message_id);

    // Download audio file from the media URL
    console.log(`Downloading audio from: ${media_url}`);
    const audioResponse = await fetch(media_url);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });

    // Prepare form data for ElevenLabs API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model_id', 'scribe_v1');

    // Call ElevenLabs Speech-to-Text API
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('Sending audio to ElevenLabs for transcription with model: scribe_v1');
    const transcriptionResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: formData,
    });

    console.log(`ElevenLabs API response status: ${transcriptionResponse.status}`);

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${transcriptionResponse.status} - ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcriptionText = transcriptionResult.text || '';

    console.log(`Transcription completed successfully. Length: ${transcriptionText.length} chars`);
    console.log(`Transcription preview: ${transcriptionText.substring(0, 100)}...`);

    // Update message with transcription
    const { error: updateError } = await supabase
      .from('messages')
      .update({ 
        transcription: transcriptionText,
        transcription_status: 'completed'
      })
      .eq('id', message_id);

    if (updateError) {
      console.error('Error updating message:', updateError);
      throw updateError;
    }

    // TRIGGER AI PROCESSING AFTER TRANSCRIPTION COMPLETES
    console.log('🤖 Triggering AI processing for transcribed audio...');
    
    // Buscar dados da conversa
    const { data: messageData } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('id', message_id)
      .single();

    if (messageData?.conversation_id) {
      try {
        // Processar com agentes de IA usando o texto transcrito
        await processTranscribedMessage(messageData.conversation_id, transcriptionText);
        console.log('✅ AI processing completed for transcribed audio');
      } catch (aiError) {
        console.error('Error processing transcribed message with AI:', aiError);
        
        // Log error but don't fail the transcription
        await supabase.from('system_logs').insert({
          level: 'error',
          source: 'transcribe-audio-ai-processing',
          message: 'Failed to process transcribed message with AI',
          data: { 
            error: aiError.message, 
            message_id,
            transcription: transcriptionText 
          }
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcription: transcriptionText,
        message_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Transcription error:', error);

    // Try to update status to failed if we have message_id from original request
    if (requestData && requestData.message_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('messages')
          .update({ transcription_status: 'failed' })
          .eq('id', requestData.message_id);
          
        console.log(`Updated message ${requestData.message_id} status to failed`);
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Função para processar mensagem transcrita com agentes de IA
async function processTranscribedMessage(conversationId: string, transcriptionText: string) {
  console.log(`🤖 Processing transcribed message for conversation: ${conversationId}`);

  // Initialize Supabase client for this function
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Classificar a intenção da mensagem transcrita
  console.log('Step 1: Classifying transcribed audio intent...');
  const { data: classificationResult, error: classifyError } = await supabase.functions.invoke('classify-intent-llm', {
    body: {
      conversationId,
      message: transcriptionText
    }
  });

  if (classifyError) {
    console.error('Classification failed:', classifyError);
  } else {
    console.log('Classification result:', classificationResult);
    
    // Atualizar product_group da conversa se classificação foi bem-sucedida
    if (classificationResult?.productGroup && classificationResult.productGroup !== 'indefinido') {
      try {
        const { data: currentConversation } = await supabase
          .from('conversations')
          .select('product_group, current_agent_id')
          .eq('id', conversationId)
          .single();
          
        // APLICAR LOCK DE CATEGORIA PARA TRANSCRIÇÕES
        const SPECIFIC_CATEGORIES = ['ferramentas', 'telha_shingle', 'energia_solar', 'steel_frame', 'drywall_divisorias', 'pisos', 'acabamentos', 'forros'];
        
        // Verificar se categoria atual é específica (bloqueada)
        if (currentConversation?.product_group && SPECIFIC_CATEGORIES.includes(currentConversation.product_group)) {
          console.log(`🔒 Transcription category update blocked: ${currentConversation.product_group} is locked`);
          
          // Log da tentativa bloqueada
          await supabase.from('system_logs').insert({
            level: 'info',
            source: 'transcribe-audio-category-lock',
            message: 'Transcription category change blocked by lock system',
            data: { 
              conversationId,
              currentCategory: currentConversation.product_group,
              attemptedCategory: classificationResult.productGroup,
              transcriptionText,
              classificationResult
            }
          });
        }
        // Só atualizar se houve mudança de categoria E categoria atual não é específica
        else if (currentConversation && currentConversation.product_group !== classificationResult.productGroup) {
          console.log(`🔄 Updating conversation category from transcription: ${currentConversation.product_group} → ${classificationResult.productGroup}`);
          
          await supabase
            .from('conversations')
            .update({
              product_group: classificationResult.productGroup,
              classification_updated_at: new Date().toISOString(),
              confidence_score: classificationResult.confidence || 0
            })
            .eq('id', conversationId);
            
          console.log(`✅ Conversation category updated from transcription`);
        }
      } catch (updateError) {
        console.error('Error updating conversation category:', updateError);
      }
    }
  }

  // 2. Extrair dados do cliente da mensagem transcrita
  console.log('Step 2: Extracting customer data from transcription...');
  const { data: extractionResult, error: extractError } = await supabase.functions.invoke('extract-customer-data', {
    body: {
      conversationId,
      message: transcriptionText
    }
  });

  if (extractError) {
    console.error('Extraction failed:', extractError);
  } else {
    console.log('Extraction result:', extractionResult);
  }

  // 3. Gerar resposta inteligente usando agentes de IA
  console.log('Step 3: Generating intelligent response for transcription...');
  const { data: responseResult, error: responseError } = await supabase.functions.invoke('intelligent-agent-response', {
    body: {
      conversationId,
      message: transcriptionText,
      productCategory: classificationResult?.productGroup || 'indefinido'
    }
  });

  if (responseError) {
    console.error('Response generation failed:', responseError);
    
    // Fallback: usar agente geral se falhar
    const { data: fallbackResult } = await supabase.functions.invoke('intelligent-agent-response', {
      body: {
        conversationId,
        message: transcriptionText,
        productCategory: 'indefinido'
      }
    });
    
    console.log('Fallback response for transcription:', fallbackResult);
    
    if (fallbackResult?.response) {
      await sendWhatsAppResponseFromTranscription(conversationId, fallbackResult.response);
    }
  } else {
    console.log('AI Response generated for transcription:', responseResult);
    
    if (responseResult?.response) {
      await sendWhatsAppResponseFromTranscription(conversationId, responseResult.response);
    }
  }
}

// Função para enviar resposta via WhatsApp (duplicata necessária)
async function sendWhatsAppResponseFromTranscription(conversationId: string, response: string) {
  try {
    // Initialize Supabase client for this function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      console.error('Failed to send WhatsApp message from transcription:', sendError);
    } else {
      console.log('WhatsApp message sent successfully from transcription:', sendResult);
    }

  } catch (error) {
    console.error('Error sending WhatsApp response from transcription:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'transcribe-audio-send-response',
      message: 'Failed to send WhatsApp response from transcription',
      data: { error: error.message, conversationId, response: response.substring(0, 100) }
    });
  }
}