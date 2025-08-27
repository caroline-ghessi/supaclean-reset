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
              await handleIncomingMessage(message, messageData.contacts?.[0]);
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
          profile_pic_url: contact?.profile?.picture || null,
          status: 'in_bot',
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

    switch (type) {
      case 'text':
        content = message.text.body;
        break;
      case 'interactive':
        if (message.interactive.type === 'button_reply') {
          content = message.interactive.button_reply.title;
        } else if (message.interactive.type === 'list_reply') {
          content = message.interactive.list_reply.title;
        }
        break;
      case 'image':
      case 'document':
      case 'audio':
      case 'video':
        mediaType = type;
        mediaUrl = message[type]?.id || message[type]?.link;
        content = message[type]?.caption || `[${type} enviado]`;
        break;
      default:
        content = `[${type} não suportado]`;
    }

    // Save message
    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      whatsapp_message_id: whatsappMessageId,
      sender_type: 'customer',
      content,
      media_type: mediaType,
      media_url: mediaUrl,
      status: 'delivered',
      created_at: new Date(parseInt(timestamp) * 1000).toISOString()
    });

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

    // Trigger bot processing (call orchestrator)
    const { error: functionError } = await supabase.functions.invoke('process-whatsapp-message', {
      body: {
        conversationId: conversation.id,
        message: content,
        whatsappNumber: from
      }
    });

    if (functionError) {
      console.error('Failed to process message with bot:', functionError);
    }

    console.log('Message processed successfully:', {
      conversationId: conversation.id,
      messageId: whatsappMessageId,
      content: content.substring(0, 50)
    });

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

    // Update message status
    const { error } = await supabase
      .from('messages')
      .update({
        status: mappedStatus,
        [`${messageStatus}_at`]: statusTimestamp
      })
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