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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { whatsapp_number } = await req.json();

    if (!whatsapp_number) {
      throw new Error('WhatsApp number is required');
    }

    console.log(`Checking for closed conversation for: ${whatsapp_number}`);

    // Check if there's a closed conversation for this number
    const { data: conversation, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('whatsapp_number', whatsapp_number)
      .eq('status', 'closed')
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    // If no closed conversation found, nothing to reactivate
    if (!conversation) {
      console.log('No closed conversation found for this number');
      return new Response(
        JSON.stringify({ 
          reactivated: false, 
          message: 'No closed conversation found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found closed conversation: ${conversation.id}`);

    // Reactivate the conversation
    const reactivationCount = (conversation.metadata?.reactivation_count || 0) + 1;
    
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: 'in_bot',
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...conversation.metadata,
          reactivated_at: new Date().toISOString(),
          reactivation_count: reactivationCount,
          previous_close_reason: conversation.metadata?.close_reason,
          reactivation_history: [
            ...(conversation.metadata?.reactivation_history || []),
            {
              reactivated_at: new Date().toISOString(),
              count: reactivationCount
            }
          ]
        }
      })
      .eq('id', conversation.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the reactivation
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'conversation_reactivation',
      message: `Conversa reativada automaticamente`,
      data: {
        conversation_id: conversation.id,
        whatsapp_number: whatsapp_number,
        reactivation_count: reactivationCount,
        previous_close_reason: conversation.metadata?.close_reason,
        reactivated_at: new Date().toISOString()
      }
    });

    console.log(`Successfully reactivated conversation: ${conversation.id}`);

    return new Response(
      JSON.stringify({ 
        reactivated: true, 
        conversation: updatedConversation,
        reactivation_count: reactivationCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in reactivate-conversation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        reactivated: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});