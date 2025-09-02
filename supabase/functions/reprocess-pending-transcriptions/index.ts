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

  try {
    console.log('🔄 Starting reprocessing of pending transcriptions');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all messages with pending transcription status
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id, media_url, transcription_status, created_at')
      .eq('transcription_status', 'pending')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10); // Process maximum 10 at a time to avoid timeouts

    if (fetchError) {
      console.error('Error fetching pending messages:', fetchError);
      throw fetchError;
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log('No pending transcriptions found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending transcriptions found',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${pendingMessages.length} pending transcriptions to reprocess`);

    const results = [];
    
    // Process each pending transcription
    for (const message of pendingMessages) {
      try {
        console.log(`Processing message ${message.id} from ${message.created_at}`);
        
        // Call the transcribe-audio function
        const transcribeResult = await supabase.functions.invoke('transcribe-audio', {
          body: {
            message_id: message.id,
            media_url: message.media_url
          }
        });

        if (transcribeResult.error) {
          console.error(`Transcription failed for message ${message.id}:`, transcribeResult.error);
          results.push({
            messageId: message.id,
            status: 'failed',
            error: transcribeResult.error.message
          });
        } else {
          console.log(`Transcription completed for message ${message.id}`);
          results.push({
            messageId: message.id,
            status: 'success'
          });
        }

        // Add a small delay between requests to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        results.push({
          messageId: message.id,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status !== 'success').length;

    console.log(`Reprocessing completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Reprocessed ${pendingMessages.length} pending transcriptions`,
        processed: pendingMessages.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Reprocessing error:', error);

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