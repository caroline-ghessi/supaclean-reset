import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WhatsApp Business API credentials
const whatsappToken = Deno.env.get('META_ACCESS_TOKEN')!;
const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, quickReplies } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendWhatsAppMessage(to, message, quickReplies);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendWhatsAppMessage(to: string, text: string, quickReplies?: string[]) {
  const baseUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  
  let messagePayload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhoneNumber(to),
    type: 'text',
    text: { body: text }
  };

  // If we have quick replies, send as interactive message
  if (quickReplies && quickReplies.length > 0 && quickReplies.length <= 3) {
    messagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formatPhoneNumber(to),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: quickReplies.map((btn, idx) => ({
            type: 'reply',
            reply: {
              id: `btn_${idx}`,
              title: btn.substring(0, 20) // WhatsApp limit
            }
          }))
        }
      }
    };
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${whatsappToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messagePayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp API error: ${errorText}`);
  }

  const data = await response.json();
  console.log('WhatsApp message sent successfully:', {
    to,
    messageId: data.messages?.[0]?.id,
    hasQuickReplies: !!quickReplies?.length
  });

  return data;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Brazil country code if missing
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}