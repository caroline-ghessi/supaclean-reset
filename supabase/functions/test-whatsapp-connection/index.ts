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
    // Test connection by fetching phone number info
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json'
        },
        method: 'GET'
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log('WhatsApp connection test successful:', {
      phoneNumberId,
      displayName: data.display_phone_number,
      verifiedName: data.verified_name
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          phoneNumberId,
          displayPhoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('WhatsApp connection test failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});