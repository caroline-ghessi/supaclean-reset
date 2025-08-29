import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { vendor_id } = await req.json();

    if (!vendor_id) {
      return new Response(JSON.stringify({ error: 'vendor_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o vendedor existe
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, phone_number, whapi_channel_id, token_configured, is_active')
      .eq('id', vendor_id)
      .single();

    if (vendorError || !vendor) {
      return new Response(JSON.stringify({ 
        error: 'Vendor not found',
        details: vendorError?.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o token está configurado nos secrets
    const vendorToken = Deno.env.get(`VENDOR_TOKEN_${vendor_id}`);
    const tokenExists = !!vendorToken;

    // Atualizar status do token se necessário
    if (tokenExists && !vendor.token_configured) {
      await supabase
        .from('vendors')
        .update({ token_configured: true, updated_at: new Date().toISOString() })
        .eq('id', vendor_id);

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'test-vendor-webhook',
        message: 'Updated token_configured status based on secret detection',
        data: { vendor_id, vendor_name: vendor.name }
      });
    }

    // Simular mensagem de teste no formato Whapi Cloud
    const testMessage = {
      messages: [{
        id: `test_${Date.now()}`,
        chat_id: '5511999999999@c.us',
        from_me: false,
        from: '5511999999999',
        from_name: 'Cliente Teste',
        type: 'text',
        timestamp: Math.floor(Date.now() / 1000),
        text: { body: 'Mensagem de teste do sistema - Whapi Cloud format' }
      }]
    };

    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'test-vendor-webhook',
      message: 'Testing vendor webhook with Whapi Cloud format',
      data: { vendor_id, test_message: testMessage, vendor_name: vendor.name }
    });

    // Tentar processar com o webhook do vendor (novo formato com vendor_id na URL)
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/vendor-whatsapp-webhook?vendor_id=${vendor_id}`;
    
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      });

      const webhookResult = await webhookResponse.text();
      
      return new Response(JSON.stringify({
        vendor: {
          id: vendor.id,
          name: vendor.name,
          phone_number: vendor.phone_number,
          is_active: vendor.is_active,
          token_configured: tokenExists ? true : vendor.token_configured
        },
        token_status: {
          secret_exists: tokenExists,
          db_configured: vendor.token_configured,
          auto_updated: tokenExists && !vendor.token_configured
        },
        webhook_test: {
          url: webhookUrl,
          status: webhookResponse.status,
          success: webhookResponse.ok,
          response: webhookResult
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (webhookError) {
      return new Response(JSON.stringify({
        vendor: {
          id: vendor.id,
          name: vendor.name,
          phone_number: vendor.phone_number,
          is_active: vendor.is_active,
          token_configured: tokenExists ? true : vendor.token_configured
        },
        token_status: {
          secret_exists: tokenExists,
          db_configured: vendor.token_configured,
          auto_updated: tokenExists && !vendor.token_configured
        },
        webhook_test: {
          url: webhookUrl,
          success: false,
          error: webhookError.message
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Test webhook error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Test failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});