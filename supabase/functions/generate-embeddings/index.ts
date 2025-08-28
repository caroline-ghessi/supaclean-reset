import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GenerateEmbeddingsRequest {
  fileId?: string;
  content: string;
  generateChunks?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, content, generateChunks = true }: GenerateEmbeddingsRequest = await req.json();

    if (!content) {
      throw new Error('Content is required');
    }

    // If this is just a query embedding (no file processing)
    if (!generateChunks) {
      const embedding = await generateEmbedding(content);
      return new Response(
        JSON.stringify({ 
          success: true, 
          embedding: embedding 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!fileId) {
      throw new Error('File ID is required for chunk processing');
    }

    console.log(`Generating embeddings for file: ${fileId}`);

    // Generate embedding for the entire content
    const fullEmbedding = await generateEmbedding(content);
    
    // Update the file with the full embedding
    const { error: updateError } = await supabase
      .from('agent_knowledge_files')
      .update({ content_embedding: fullEmbedding })
      .eq('id', fileId);

    if (updateError) {
      throw new Error(`Failed to update file embedding: ${updateError.message}`);
    }

    // Get file details
    const { data: fileData, error: fileError } = await supabase
      .from('agent_knowledge_files')
      .select('agent_category, file_name')
      .eq('id', fileId)
      .single();

    if (fileError) {
      throw new Error(`Failed to get file details: ${fileError.message}`);
    }

    // Create chunks for better RAG performance
    const chunks = createChunks(content);
    console.log(`Created ${chunks.length} chunks for file: ${fileId}`);

    // Generate embeddings for each chunk
    const chunkData = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      const chunkEmbedding = await generateEmbedding(chunk);
      
      chunkData.push({
        agent_category: fileData.agent_category,
        file_id: fileId,
        chunk_index: i,
        content: chunk,
        content_embedding: chunkEmbedding,
        token_count: estimateTokens(chunk),
        metadata: {
          file_name: fileData.file_name,
          chunk_size: chunk.length
        }
      });
    }

    // Insert all chunks
    const { error: chunksError } = await supabase
      .from('knowledge_chunks')
      .insert(chunkData);

    if (chunksError) {
      throw new Error(`Failed to insert chunks: ${chunksError.message}`);
    }

    console.log(`Successfully processed ${chunks.length} chunks for file: ${fileId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksCreated: chunks.length,
        message: 'Embeddings generated successfully' 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating embeddings:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function createChunks(content: string, maxChunkSize: number = 1000): string[] {
  // Split by paragraphs first
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would make chunk too large
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks were created (single very long paragraph), split by sentences
  if (chunks.length === 0) {
    const sentences = content.split(/\.\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim() + '.');
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks.length > 0 ? chunks : [content];
}

function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}