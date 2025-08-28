import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mediaId, mediaType } = await req.json();
    
    if (!mediaId) {
      throw new Error('Media ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading media with ID: ${mediaId}, type: ${mediaType}`);

    // Step 1: Get media URL from WhatsApp API
    const mediaUrlResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${metaAccessToken}`,
      },
    });

    if (!mediaUrlResponse.ok) {
      throw new Error(`Failed to get media URL: ${mediaUrlResponse.statusText}`);
    }

    const mediaData = await mediaUrlResponse.json();
    console.log('Media data:', mediaData);

    // Step 2: Download the actual media file
    const mediaFileResponse = await fetch(mediaData.url, {
      headers: {
        'Authorization': `Bearer ${metaAccessToken}`,
      },
    });

    if (!mediaFileResponse.ok) {
      throw new Error(`Failed to download media: ${mediaFileResponse.statusText}`);
    }

    const mediaBuffer = await mediaFileResponse.arrayBuffer();
    const uint8Array = new Uint8Array(mediaBuffer);

    // Step 3: Determine file extension based on MIME type
    const mimeType = mediaData.mime_type || mediaType || 'application/octet-stream';
    const extension = getExtensionFromMimeType(mimeType);
    const fileName = `${mediaId}.${extension}`;
    const filePath = `media/${fileName}`;

    console.log(`Uploading file: ${filePath}, MIME type: ${mimeType}`);

    // Step 4: Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('whatsapp-media')
      .upload(filePath, uint8Array, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    // Step 5: Get public URL
    const { data: urlData } = supabase.storage
      .from('whatsapp-media')
      .getPublicUrl(filePath);

    console.log(`File uploaded successfully: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        publicUrl: urlData.publicUrl,
        fileName,
        mimeType,
        fileSize: mediaBuffer.byteLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error downloading media:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
  };

  return mimeMap[mimeType] || 'bin';
}