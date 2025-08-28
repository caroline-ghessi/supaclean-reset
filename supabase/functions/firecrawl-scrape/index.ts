import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { url, agentCategory, mode, options = {} } = await req.json();

    console.log(`🔥 Starting Firecrawl ${mode} for URL: ${url}, Agent: ${agentCategory}`);

    // Prepare Firecrawl API request for v2 - ESTRUTURA CORRIGIDA
    const firecrawlEndpoint = mode === 'scrape' 
      ? 'https://api.firecrawl.dev/v2/scrape' 
      : 'https://api.firecrawl.dev/v2/crawl';

    // ✅ PAYLOAD CORRETO PARA V2 - TODOS OS PARÂMETROS NO NÍVEL RAIZ
    const firecrawlPayload = {
      url,
      // Formats no nível raiz
      formats: options.formats || ['markdown', 'html'],
      
      // Parâmetros de conteúdo no nível raiz (NÃO dentro de options)
      onlyMainContent: true,
      includeTags: [
        'article', 'main', 'content', 'post', 'div', 'section', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ],
      excludeTags: [
        'nav', 'footer', 'aside', 'ad', 'script', 'style', 'header', 'menu', 'sidebar'
      ],
      
      // Configurações de processamento no nível raiz
      removeBase64Images: true,
      waitFor: 2000,
      timeout: 30000,
      
      // Headers no nível raiz (NÃO dentro de options)
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      
      // Actions no formato correto
      actions: [
        {
          type: 'wait',
          milliseconds: 2000
        }
      ]
    };

    // Configurações específicas para crawl
    if (mode === 'crawl') {
      firecrawlPayload.limit = options.limit || 50;
      firecrawlPayload.maxDepth = options.maxDepth || 3;
      
      if (options.includePatterns?.length) {
        firecrawlPayload.includePatterns = options.includePatterns;
      }
      if (options.excludePatterns?.length) {
        firecrawlPayload.excludePatterns = options.excludePatterns;
      }
    }

    console.log('📤 Firecrawl payload:', JSON.stringify(firecrawlPayload, null, 2));

    // Call Firecrawl API
    const firecrawlResponse = await fetch(firecrawlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify(firecrawlPayload)
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('❌ Firecrawl API error:', errorText);
      throw new Error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log('✅ Firecrawl response received');

    // ✅ PROCESSAMENTO CORRIGIDO DA RESPOSTA V2
    if (!firecrawlData.success) {
      throw new Error(`Firecrawl failed: ${firecrawlData.error || 'Unknown error'}`);
    }

    // Para v2, sempre verificar se existe data
    if (!firecrawlData.data) {
      throw new Error('No data returned from Firecrawl');
    }

    // Processar resultados - v2 sempre retorna 'data'
    let results;
    if (mode === 'scrape') {
      // Para scrape, data é um objeto único
      results = [firecrawlData.data];
    } else {
      // Para crawl, data é um array de objetos
      results = Array.isArray(firecrawlData.data) ? firecrawlData.data : [firecrawlData.data];
    }

    console.log(`📊 Processing ${results.length} items`);

    const processedFiles = [];

    for (const [index, item] of results.entries()) {
      console.log(`📝 Processing item ${index + 1}:`, {
        hasMarkdown: !!item.markdown,
        markdownLength: item.markdown?.length || 0,
        markdownPreview: item.markdown?.substring(0, 200) || 'No markdown',
        hasMetadata: !!item.metadata,
        url: item.metadata?.sourceURL || item.url || url
      });

      // Validação melhorada - aceitar conteúdo mínimo
      if (!item.markdown || item.markdown.trim().length < 50) {
        console.log(`⚠️ Skipping item ${index + 1}: insufficient content (${item.markdown?.length || 0} chars)`);
        continue;
      }

      // Generate filename melhorado
      const title = item.metadata?.title || 
                   item.metadata?.og?.title || 
                   `Content_${index + 1}`;
      
      const sanitizedTitle = title
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      const fileName = `${sanitizedTitle}_${Date.now()}_${index}.md`;
      const storagePath = `${agentCategory}/${fileName}`;

      try {
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agent-knowledge')
          .upload(storagePath, new Blob([item.markdown], { type: 'text/markdown' }));

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
          continue;
        }

        // Save to database com metadata melhorada
        const { data: fileRecord, error: dbError } = await supabase
          .from('agent_knowledge_files')
          .insert({
            agent_category: agentCategory,
            file_name: fileName,
            file_type: 'text/markdown',
            storage_path: storagePath,
            file_size: new TextEncoder().encode(item.markdown).length,
            extracted_content: item.markdown,
            processing_status: 'completed',
            metadata: {
              source_type: 'web',
              source_url: item.metadata?.sourceURL || item.url || url,
              title: title,
              description: item.metadata?.description || item.metadata?.og?.description,
              scraped_at: new Date().toISOString(),
              firecrawl_metadata: item.metadata,
              confidence_score: 1.0,
              // Adicionar mais metadados úteis
              language: item.metadata?.language,
              author: item.metadata?.author,
              publishedTime: item.metadata?.publishedTime,
              statusCode: item.metadata?.statusCode,
              contentLength: item.markdown.length
            }
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Database error:', dbError);
          continue;
        }

        console.log(`✅ Processed: ${fileName} (${item.markdown.length} chars)`);
        processedFiles.push(fileRecord);

        // Generate embeddings in background
        try {
          supabase.functions.invoke('generate-embeddings', {
            body: { fileId: fileRecord.id }
          }).catch(embeddingError => {
            console.warn('⚠️ Embedding generation failed:', embeddingError);
          });
        } catch (embeddingError) {
          console.warn('⚠️ Could not trigger embedding generation:', embeddingError);
        }

      } catch (itemError) {
        console.error(`❌ Error processing item ${index + 1}:`, itemError);
        continue;
      }
    }

    console.log(`🎉 Successfully processed ${processedFiles.length} files`);

    // Resposta melhorada
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${processedFiles.length} ${mode === 'scrape' ? 'page' : 'pages'} from ${url}`,
      processedFiles: processedFiles.length,
      totalItemsFound: results.length,
      skippedItems: results.length - processedFiles.length,
      files: processedFiles,
      agentCategory,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Firecrawl processing error:', error);
    
    // Resposta de erro melhorada
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      endpoint: 'firecrawl-scrape'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});