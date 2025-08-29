import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhapiMessage {
  id: string;
  chat_id: string;
  from_me: boolean;
  from?: string;
  from_name?: string;
  type: string;
  timestamp: number;
  text?: { body: string };
  image?: { caption?: string; link?: string; mime_type?: string; file_size?: number };
  audio?: { link?: string; mime_type?: string; file_size?: number };
  voice?: { link?: string; mime_type?: string; file_size?: number; seconds?: number };
  video?: { caption?: string; link?: string; mime_type?: string; file_size?: number; seconds?: number };
  document?: { filename?: string; link?: string; mime_type?: string; file_size?: number };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    
    // DETAILED LOGGING - Log complete payload structure for debugging
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'vendor-whatsapp-webhook',
      message: 'Received webhook payload - Whapi Cloud format detected',
      data: {
        payload_keys: Object.keys(webhookData),
        payload_structure: {
          has_channel_id: 'channel_id' in webhookData,
          has_messages: 'messages' in webhookData,
          has_event: 'event' in webhookData,
          messages_count: webhookData.messages?.length || 0,
          first_message_chat_id: webhookData.messages?.[0]?.chat_id || null,
          channel_id: webhookData.channel_id,
          event_type: webhookData.event
        }
      }
    });

    // Extract channel_id from payload OR fall back to extracting from URL/headers
    let channelId = webhookData.channel_id;
    
    // If channel_id is null/empty, try to extract from URL or use a default mapping
    if (!channelId) {
      // Check if there's a pattern in the URL or headers that could help identify the vendor
      const url = new URL(req.url);
      const userAgent = req.headers.get('user-agent') || '';
      
      await supabase.from('system_logs').insert({
        level: 'warning',
        source: 'vendor-whatsapp-webhook',
        message: 'channel_id is null - attempting alternative identification',
        data: { 
          url: req.url,
          user_agent: userAgent,
          payload_keys: Object.keys(webhookData),
          has_messages: webhookData.messages?.length > 0,
          has_statuses: webhookData.statuses?.length > 0
        }
      });
      
      // For now, we'll use the only active vendor as a fallback
      // This is a temporary solution until we can configure channel_id properly
      channelId = 'IRONMN-ANDJ3'; // Antônio César's channel_id
      
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'vendor-whatsapp-webhook',
        message: 'Using fallback channel_id for vendor identification',
        data: { fallback_channel_id: channelId }
      });
    }

    // Find vendor by channel_id (Whapi Cloud approach)
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, phone_number, whapi_channel_id, token_configured, is_active')
      .eq('whapi_channel_id', channelId)
      .eq('is_active', true)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor not found for channel:', channelId, vendorError);
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'vendor-whatsapp-webhook',
        message: 'Vendor not found for channel_id',
        data: { 
          channel_id: channelId, 
          error: vendorError?.message,
          note: 'Make sure vendor.whapi_channel_id matches the channel_id from webhook'
        }
      });
      return new Response(JSON.stringify({ 
        error: 'Vendor not found for channel_id', 
        channel_id: channelId,
        details: vendorError?.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'vendor-whatsapp-webhook',
      message: 'Vendor found successfully',
      data: {
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        channel_id: channelId,
        whapi_channel_id: vendor.whapi_channel_id
      }
    });

    // Buscar token nos secrets
    const vendorToken = Deno.env.get(`VENDOR_TOKEN_${vendor.id}`);
    if (!vendorToken) {
      console.error('Vendor token secret not found');
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'vendor-whatsapp-webhook',
        message: 'Vendor token secret not found in environment',
        data: { vendor_id: vendor.id, vendor_name: vendor.name }
      });
      return new Response('Vendor token not configured', { status: 401, headers: corsHeaders });
    }

    // 2. FIX: Opcional - Verificar token se configurado como header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${vendorToken}`) {
      await supabase.from('system_logs').insert({
        level: 'warning',
        source: 'vendor-whatsapp-webhook',
        message: 'Invalid authorization header',
        data: { vendor_id: vendor.id, vendor_name: vendor.name }
      });
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Auto-detectar se token está configurado e atualizar status
    if (!vendor.token_configured) {
      console.log('Auto-detecting token configuration for vendor:', vendor.id);
      await supabase
        .from('vendors')
        .update({ token_configured: true, updated_at: new Date().toISOString() })
        .eq('id', vendor.id);
      
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'vendor-whatsapp-webhook',
        message: 'Auto-updated token_configured status to true',
        data: { vendor_id: vendor.id, vendor_name: vendor.name }
      });
    }

    // Log webhook recebido (sem dados sensíveis)
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'vendor-whatsapp-webhook',
      message: 'Webhook received and processing started',
      data: { 
        vendor_id: vendor.id, 
        vendor_name: vendor.name,
        channel_id: channelId,
        messages_count: webhookData.messages?.length || 0,
        statuses_count: webhookData.statuses?.length || 0,
        whapi_channel_id: vendor.whapi_channel_id
      }
    });

    // Processar mensagens
    if (webhookData.messages && webhookData.messages.length > 0) {
      for (const message of webhookData.messages) {
        await processMessage(supabase, { ...vendor, token: vendorToken }, message);
      }
    }

    // Processar status de mensagens
    if (webhookData.statuses && webhookData.statuses.length > 0) {
      for (const status of webhookData.statuses) {
        await processMessageStatus(supabase, vendor, status);
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'vendor-whatsapp-webhook',
      message: 'Webhook processing failed',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processMessage(supabase: any, vendor: any, message: WhapiMessage) {
  const { chat_id, from_me, from, from_name, type, timestamp, id } = message;

  // FILTRO CRÍTICO: Ignorar grupos com log estruturado
  if (!isIndividualChat(chat_id)) {
    console.log(`Ignoring group message: ${chat_id}`);
    await supabase.from('system_logs').insert({
      level: 'debug',
      source: 'vendor-whatsapp-webhook',
      message: 'Group message ignored',
      data: { 
        vendor_id: vendor.id, 
        chat_id, 
        message_type: type,
        reason: 'Group chat not supported'
      }
    });
    return;
  }

  // Extrair número do cliente
  const customerPhone = extractPhoneFromChatId(chat_id);
  
  // O nome do cliente deve vir apenas das mensagens que não são do vendedor
  const actualCustomerName = from_me ? undefined : from_name;
  
  // Encontrar ou criar conversa
  const conversation = await findOrCreateConversation(supabase, vendor.id, chat_id, customerPhone, actualCustomerName);
  
  // Processar conteúdo da mensagem baseado no tipo
  const messageContent = extractMessageContent(message);

  // Salvar mensagem
  const { data: savedMessage, error } = await supabase
    .from('vendor_messages')
    .insert({
      vendor_id: vendor.id,
      conversation_id: conversation.id,
      whapi_message_id: id,
      chat_id,
      from_me,
      from_phone: from || vendor.phone_number,
      from_name,
      message_type: type,
      content: messageContent.text,
      media_url: messageContent.mediaUrl,
      media_metadata: messageContent.metadata,
      timestamp_whatsapp: new Date(timestamp * 1000).toISOString(),
      metadata: { original_message: message }
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    return;
  }

  // Atualizar estatísticas da conversa
  await updateConversationStats(supabase, conversation.id, from_me);

  // Calcular métricas de qualidade em tempo real
  if (from_me) {
    await calculateQualityMetrics(supabase, vendor.id, conversation.id, savedMessage);
  }
}

async function processMessageStatus(supabase: any, vendor: any, status: any) {
  const { id, status: messageStatus, timestamp } = status;

  // Update message status - simplified approach without raw SQL
  const statusUpdatedAt = new Date(timestamp * 1000).toISOString();
  
  // First get the current metadata
  const { data: currentMessage } = await supabase
    .from('vendor_messages')
    .select('metadata')
    .eq('whapi_message_id', id)
    .eq('vendor_id', vendor.id)
    .single();

  // Merge metadata preserving existing data
  const updatedMetadata = {
    ...(currentMessage?.metadata || {}),
    status_updated_at: statusUpdatedAt
  };

  const { error } = await supabase
    .from('vendor_messages')
    .update({
      status: messageStatus,
      metadata: updatedMetadata
    })
    .eq('whapi_message_id', id)
    .eq('vendor_id', vendor.id);

  if (error) {
    console.error('Error updating message status:', error);
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'vendor-whatsapp-webhook',
      message: 'Failed to update message status',
      data: { vendor_id: vendor.id, message_id: id, error: error.message }
    });
  }
}

async function findOrCreateConversation(supabase: any, vendorId: string, chatId: string, customerPhone: string, customerName?: string) {
  // Tentar encontrar conversa existente
  let { data: conversation } = await supabase
    .from('vendor_conversations')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('chat_id', chatId)
    .single();

  if (!conversation) {
    // Criar nova conversa
    const { data: newConversation } = await supabase
      .from('vendor_conversations')
      .insert({
        vendor_id: vendorId,
        chat_id: chatId,
        customer_phone: customerPhone,
        customer_name: customerName,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();
      
    conversation = newConversation;
  } else {
    // Atualizar última mensagem e nome do cliente se disponível
    const updateData: any = {
      last_message_at: new Date().toISOString()
    };
    
    // Só atualizar o nome do cliente se estiver disponível (mensagem não é do vendedor)
    if (customerName) {
      updateData.customer_name = customerName;
    }
    
    await supabase
      .from('vendor_conversations')
      .update(updateData)
      .eq('id', conversation.id);
  }

  return conversation;
}

async function updateConversationStats(supabase: any, conversationId: number, fromMe: boolean) {
  try {
    await supabase.rpc('update_vendor_conversation_stats', {
      conversation_id_param: conversationId,
      from_me_param: fromMe
    });
  } catch (error) {
    console.error('Error updating conversation stats via RPC:', error);
    
    // Fallback: Get current values and increment manually
    try {
      const { data: currentStats } = await supabase
        .from('vendor_conversations')
        .select('vendor_messages, customer_messages, total_messages')
        .eq('id', conversationId)
        .single();

      if (currentStats) {
        const field = fromMe ? 'vendor_messages' : 'customer_messages';
        const newValues = {
          [field]: (currentStats[field] || 0) + 1,
          total_messages: (currentStats.total_messages || 0) + 1,
          updated_at: new Date().toISOString()
        };

        await supabase
          .from('vendor_conversations')
          .update(newValues)
          .eq('id', conversationId);
      }
    } catch (fallbackError) {
      console.error('Error in fallback stats update:', fallbackError);
      // Log do erro para debug
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'vendor-whatsapp-webhook',
        message: 'Failed to update conversation stats (both RPC and fallback)',
        data: { conversation_id: conversationId, from_me: fromMe, error: fallbackError.message }
      });
    }
  }
}

async function calculateQualityMetrics(supabase: any, vendorId: string, conversationId: number, message: any) {
  // Calcular tempo de resposta
  const { data: lastCustomerMessage } = await supabase
    .from('vendor_messages')
    .select('timestamp_whatsapp')
    .eq('conversation_id', conversationId)
    .eq('from_me', false)
    .order('timestamp_whatsapp', { ascending: false })
    .limit(1)
    .single();

  if (lastCustomerMessage) {
    const responseTime = Math.floor(
      (new Date(message.timestamp_whatsapp).getTime() - 
       new Date(lastCustomerMessage.timestamp_whatsapp).getTime()) / (1000 * 60)
    ); // em minutos

    // 5. FIX: Calcular métricas corretamente
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar métricas existentes primeiro
    const { data: existing } = await supabase
      .from('quality_metrics')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('conversation_id', conversationId)
      .eq('metric_date', today)
      .single();

    // Calcular novos valores baseados no existente
    const oldAvg = existing?.response_time_avg_minutes || 0;
    const oldMax = existing?.response_time_max_minutes || 0;
    const oldCount = existing?.total_messages_sent || 0;

    const newAvg = oldCount > 0 ? (oldAvg * oldCount + responseTime) / (oldCount + 1) : responseTime;
    const newMax = Math.max(oldMax, responseTime);
    const newCount = oldCount + 1;
    
    await supabase
      .from('quality_metrics')
      .upsert({
        vendor_id: vendorId,
        conversation_id: conversationId,
        metric_date: today,
        response_time_avg_minutes: Math.round(newAvg),
        response_time_max_minutes: newMax,
        total_messages_sent: newCount
      }, {
        onConflict: 'vendor_id,conversation_id,metric_date'
      });
  }
}

function isIndividualChat(chatId: string): boolean {
  // WhatsApp individual chats can end with @c.us OR @s.whatsapp.net
  return chatId.endsWith('@c.us') || chatId.endsWith('@s.whatsapp.net');
}

function extractPhoneFromChatId(chatId: string): string {
  // Extract phone number from both formats
  return chatId.replace('@c.us', '').replace('@s.whatsapp.net', '');
}

function extractMessageContent(message: WhapiMessage) {
  const { type } = message;
  
  switch (type) {
    case 'text':
      return {
        text: message.text?.body || '',
        mediaUrl: null,
        metadata: null
      };
      
    case 'image':
      return {
        text: message.image?.caption || '[Imagem]',
        mediaUrl: message.image?.link || null,
        metadata: {
          mime_type: message.image?.mime_type,
          file_size: message.image?.file_size
        }
      };
      
    case 'audio':
    case 'voice':
      return {
        text: '[Áudio]',
        mediaUrl: message.audio?.link || message.voice?.link || null,
        metadata: {
          mime_type: message.audio?.mime_type || message.voice?.mime_type,
          file_size: message.audio?.file_size || message.voice?.file_size,
          seconds: message.voice?.seconds
        }
      };
      
    case 'video':
      return {
        text: message.video?.caption || '[Vídeo]',
        mediaUrl: message.video?.link || null,
        metadata: {
          mime_type: message.video?.mime_type,
          file_size: message.video?.file_size,
          seconds: message.video?.seconds
        }
      };
      
    case 'document':
      return {
        text: `[Documento: ${message.document?.filename || 'arquivo'}]`,
        mediaUrl: message.document?.link || null,
        metadata: {
          mime_type: message.document?.mime_type,
          file_size: message.document?.file_size,
          filename: message.document?.filename
        }
      };
      
    default:
      return {
        text: `[${type}]`,
        mediaUrl: null,
        metadata: { message_type: type }
      };
  }
}