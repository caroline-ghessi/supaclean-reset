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
    const { message_id, media_url } = await req.json();
    
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
    formData.append('audio', audioBlob, 'audio.ogg');
    formData.append('model_id', 'eleven_multilingual_v2');

    // Call ElevenLabs Speech-to-Text API
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('Sending audio to ElevenLabs for transcription...');
    const transcriptionResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${transcriptionResponse.status} - ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcriptionText = transcriptionResult.text || '';

    console.log(`Transcription completed: ${transcriptionText.substring(0, 100)}...`);

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

    // Try to update status to failed if we have message_id
    const body = await req.clone().json().catch(() => ({}));
    if (body.message_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('messages')
          .update({ transcription_status: 'failed' })
          .eq('id', body.message_id);
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