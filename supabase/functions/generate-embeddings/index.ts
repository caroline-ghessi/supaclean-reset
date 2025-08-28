import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, content, generateChunks = true } = await req.json();

    // ✅ CORREÇÃO: Buscar conteúdo automaticamente se não fornecido
    let processContent = content;
    
    if (!processContent && fileId) {
      console.log(`📖 Fetching content for file ID: ${fileId}`);
      
      const { data: fileData, error: fileError } = await supabase
        .from('agent_knowledge_files')
        .select('extracted_content, agent_category, file_name, processing_status')
        .eq('id', fileId)
        .single();

      if (fileError) {
        throw new Error(`Failed to fetch file content: ${fileError.message}`);
      }

      if (!fileData) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      if (!fileData.extracted_content) {
        throw new Error(`File ${fileId} has no extracted content`);
      }

      processContent = fileData.extracted_content;
      console.log(`📖 Retrieved content: ${processContent.length} characters`);
    }

    // Validação final do conteúdo
    if (!processContent) {
      throw new Error('Content is required (either provided directly or via fileId)');
    }

    // If this is just a query embedding (no file processing)
    if (!generateChunks) {
      console.log(`🔍 Generating single embedding for query (${processContent.length} chars)`);
      const embedding = await generateEmbedding(processContent);
      return new Response(JSON.stringify({
        success: true,
        embedding: embedding
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Para processamento de chunks, fileId é obrigatório
    if (!fileId) {
      throw new Error('File ID is required for chunk processing');
    }

    console.log(`🔧 Generating embeddings for file: ${fileId} (${processContent.length} characters)`);

    // Get file details (buscar novamente se necessário para garantir dados atuais)
    const { data: fileData, error: fileError } = await supabase
      .from('agent_knowledge_files')
      .select('agent_category, file_name, processing_status')
      .eq('id', fileId)
      .single();

    if (fileError) {
      throw new Error(`Failed to get file details: ${fileError.message}`);
    }

    // ✅ Verificar se o arquivo já está sendo processado
    if (fileData.processing_status === 'embedding_in_progress') {
      console.log(`⚠️ File ${fileId} is already being processed, skipping...`);
      return new Response(JSON.stringify({
        success: true,
        message: 'File is already being processed',
        fileId: fileId
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // ✅ Marcar arquivo como "em processamento" para evitar duplicação
    await supabase
      .from('agent_knowledge_files')
      .update({ processing_status: 'embedding_in_progress' })
      .eq('id', fileId);

    try {
      // ✅ Verificar se já existem chunks para este arquivo
      const { data: existingChunks, error: chunksCheckError } = await supabase
        .from('knowledge_chunks')
        .select('id')
        .eq('file_id', fileId)
        .limit(1);

      if (chunksCheckError) {
        console.warn('Warning: Could not check existing chunks:', chunksCheckError);
      } else if (existingChunks && existingChunks.length > 0) {
        console.log(`📋 File ${fileId} already has embeddings, removing old ones...`);
        
        const { error: deleteError } = await supabase
          .from('knowledge_chunks')
          .delete()
          .eq('file_id', fileId);
          
        if (deleteError) {
          console.warn('Warning: Could not delete old chunks:', deleteError);
        }
      }

      // Create chunks for better RAG performance
      const chunks = createChunks(processContent);
      console.log(`📝 Created ${chunks.length} chunks for file: ${fileId}`);

      // Generate embeddings for each chunk with error handling
      const chunkData = [];
      let processedChunks = 0;
      let failedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const estimatedTokens = estimateTokens(chunk);
        
        console.log(`⚡ Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars, ~${estimatedTokens} tokens)`);

        // Skip chunks that are too large for the model
        if (estimatedTokens > 8000) {
          console.warn(`⚠️ Skipping chunk ${i + 1}: too large (${estimatedTokens} tokens)`);
          failedChunks++;
          continue;
        }

        // Skip chunks that are too small to be meaningful
        if (chunk.trim().length < 50) {
          console.warn(`⚠️ Skipping chunk ${i + 1}: too small (${chunk.length} characters)`);
          failedChunks++;
          continue;
        }

        try {
          const chunkEmbedding = await generateEmbeddingWithRetry(chunk, 3);
          
          chunkData.push({
            agent_category: fileData.agent_category,
            file_id: fileId,
            chunk_index: i,
            content: chunk,
            content_embedding: chunkEmbedding,
            token_count: estimatedTokens,
            metadata: {
              file_name: fileData.file_name,
              chunk_size: chunk.length,
              created_at: new Date().toISOString()
            }
          });
          
          processedChunks++;
          
          // ✅ Progress feedback a cada 10 chunks
          if (processedChunks % 10 === 0) {
            console.log(`📊 Progress: ${processedChunks}/${chunks.length} chunks processed`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to process chunk ${i + 1}:`, error.message);
          failedChunks++;
          continue;
        }
      }

      console.log(`📊 Chunk processing summary: ${processedChunks} successful, ${failedChunks} failed`);

      // ✅ Insert chunks in batches for better performance
      if (chunkData.length > 0) {
        const batchSize = 50;
        let insertedChunks = 0;
        
        for (let i = 0; i < chunkData.length; i += batchSize) {
          const batch = chunkData.slice(i, i + batchSize);
          
          const { error: chunksError } = await supabase
            .from('knowledge_chunks')
            .insert(batch);

          if (chunksError) {
            console.error(`❌ Failed to insert batch ${Math.floor(i/batchSize) + 1}:`, chunksError);
            // Continue with other batches instead of failing completely
            continue;
          }
          
          insertedChunks += batch.length;
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} chunks`);
        }
        
        console.log(`🎉 Total chunks inserted: ${insertedChunks}`);
      }

      // ✅ Marcar arquivo como processado com sucesso
      await supabase
        .from('agent_knowledge_files')
        .update({ 
          processing_status: 'completed_with_embeddings',
          metadata: {
            ...fileData.metadata || {},
            embeddings_generated_at: new Date().toISOString(),
            total_chunks: processedChunks,
            failed_chunks: failedChunks
          }
        })
        .eq('id', fileId);

      console.log(`🎉 Successfully processed ${processedChunks} chunks for file: ${fileId}`);

      return new Response(JSON.stringify({
        success: true,
        fileId: fileId,
        chunksCreated: processedChunks,
        chunksSkipped: failedChunks,
        totalChunks: chunks.length,
        message: `Embeddings generated successfully: ${processedChunks} chunks processed, ${failedChunks} skipped`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (processingError) {
      // ✅ Em caso de erro, marcar arquivo como falhou
      await supabase
        .from('agent_knowledge_files')
        .update({ 
          processing_status: 'failed',
          metadata: {
            ...fileData.metadata || {},
            last_error: processingError.message,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', fileId);
      
      throw processingError;
    }

  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

// ✅ Função melhorada com rate limiting
async function generateEmbedding(text) {
  // Validação do input
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.trim(),
      encoding_format: 'float'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // ✅ Tratamento específico para diferentes tipos de erro da OpenAI
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. Please try again later.`);
    } else if (response.status === 400) {
      throw new Error(`Invalid request: ${errorText}`);
    } else if (response.status === 401) {
      throw new Error(`Invalid API key or authentication failed`);
    } else {
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
  }

  const data = await response.json();
  
  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('Invalid response from OpenAI API');
  }
  
  return data.data[0].embedding;
}

// ✅ Função melhorada com backoff exponencial
async function generateEmbeddingWithRetry(text, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ✅ Backoff exponencial: 1s, 2s, 4s
      if (attempt > 1) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await generateEmbedding(text);
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Embedding attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // ✅ Não retry em erros de autenticação ou request inválido
      if (error.message.includes('Invalid API key') || error.message.includes('Invalid request')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// ✅ Função melhorada de chunking com overlap
function createChunks(content, maxChunkSize = 6000, overlap = 200) {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Limpar o conteúdo primeiro
  const cleanContent = content.trim();
  
  // Se o conteúdo é pequeno, retornar como chunk único
  if (cleanContent.length <= maxChunkSize) {
    return [cleanContent];
  }

  const chunks = [];
  
  // Split by paragraphs first
  const paragraphs = cleanContent.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // If adding this paragraph would make chunk too large
    if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // ✅ Add overlap from previous chunk
      if (overlap > 0 && currentChunk.length > overlap) {
        const overlapText = currentChunk.slice(-overlap).trim();
        currentChunk = overlapText + '\n\n' + trimmedParagraph;
      } else {
        currentChunk = trimmedParagraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
    }
  }

  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks were created (single very long paragraph), split by sentences
  if (chunks.length === 0) {
    const sentences = cleanContent.split(/\.\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim() + '.');
        
        // Add overlap
        if (overlap > 0 && currentChunk.length > overlap) {
          const overlapText = currentChunk.slice(-overlap).trim();
          currentChunk = overlapText + '. ' + trimmedSentence;
        } else {
          currentChunk = trimmedSentence;
        }
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  // ✅ Filtrar chunks muito pequenos
  const validChunks = chunks.filter(chunk => chunk.trim().length >= 50);
  
  return validChunks.length > 0 ? validChunks : [cleanContent];
}

// ✅ Função melhorada de estimativa de tokens
function estimateTokens(text) {
  if (!text) return 0;
  
  // Estimativa mais precisa baseada em:
  // - Palavras em inglês: ~1.3 tokens por palavra
  // - Caracteres: ~4 caracteres por token
  // - Pontuação e espaços também contam
  
  const wordCount = text.trim().split(/\s+/).length;
  const charEstimate = Math.ceil(text.length / 4);
  const wordEstimate = Math.ceil(wordCount * 1.3);
  
  // Usar a maior estimativa para ser conservador
  return Math.max(charEstimate, wordEstimate);
}