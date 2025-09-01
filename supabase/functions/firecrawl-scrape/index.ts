import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Verificar variáveis de ambiente
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

console.log('🔧 Environment variables check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseServiceKey,
  hasFirecrawlKey: !!firecrawlApiKey,
  supabaseUrlPreview: supabaseUrl?.substring(0, 20) + '...',
  firecrawlKeyPreview: firecrawlApiKey?.substring(0, 10) + '...'
});

Deno.serve(async (req) => {
  console.log('🚀 Function started - method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Reading request body...');
    
    // Verificar se conseguimos ler o body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('✅ Request body parsed successfully:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { url, agentCategory, mode, options = {} } = requestBody;

    if (!url || !agentCategory || !mode) {
      throw new Error('Missing required parameters: url, agentCategory, or mode');
    }

    console.log('🔧 Environment variables check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceKey,
      hasFirecrawlKey: !!firecrawlApiKey,
      supabaseUrlPreview: supabaseUrl?.substring(0, 20) + '...',
      firecrawlKeyPreview: firecrawlApiKey?.substring(0, 10) + '...'
    });

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured in environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`🔥 Starting Firecrawl ${mode} for URL: ${url}, Agent: ${agentCategory}`);

    // Prepare Firecrawl API request for v2 - CORRIGIDO CONFORME DOCUMENTAÇÃO
    const firecrawlEndpoint = mode === 'scrape' 
      ? 'https://api.firecrawl.dev/v2/scrape' 
      : 'https://api.firecrawl.dev/v2/crawl';

    // ✅ PAYLOAD CORRIGIDO PARA V2 - APENAS PARÂMETROS VÁLIDOS
    let firecrawlPayload;
    
    if (mode === 'scrape') {
      // Para scrape: pode usar formats (baseado na documentação)
      firecrawlPayload = {
        url,
        formats: [{ type: 'markdown' }], // Formato correto conforme docs v2
        onlyMainContent: true,
        removeBase64Images: true
      };
    } else {
      // Para crawl: NÃO pode usar formats (causava o erro)
      firecrawlPayload = {
        url,
        limit: options.maxDepth ? Math.min(options.maxDepth * 5, 100) : 10
      };
      
      // Para crawl, usar includeUrls/excludeUrls ao invés de includePaths/excludePaths
      if (options.includePatterns?.length) {
        // Converter patterns para URLs válidas
        firecrawlPayload.includeUrls = options.includePatterns.map(pattern => {
          // Se é um pattern relativo, criar URL completa
          if (pattern.startsWith('/')) {
            const baseUrl = new URL(url);
            return `${baseUrl.origin}${pattern}`;
          }
          return pattern;
        });
      }
      
      if (options.excludePatterns?.length) {
        firecrawlPayload.excludeUrls = options.excludePatterns.map(pattern => {
          if (pattern.startsWith('/')) {
            const baseUrl = new URL(url);
            return `${baseUrl.origin}${pattern}`;
          }
          return pattern;
        });
      }
    }

    console.log('📤 Firecrawl payload:', JSON.stringify(firecrawlPayload, null, 2));
    console.log('🌐 Firecrawl endpoint:', firecrawlEndpoint);

    // Call Firecrawl API
    console.log('⏳ Making request to Firecrawl...');
    const firecrawlResponse = await fetch(firecrawlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify(firecrawlPayload)
    });

    console.log('📡 Firecrawl response status:', firecrawlResponse.status);
    console.log('📡 Firecrawl response headers:', Object.fromEntries(firecrawlResponse.headers.entries()));

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('❌ Firecrawl API error:', errorText);
      console.error('❌ Response status:', firecrawlResponse.status);
      console.error('❌ Response status text:', firecrawlResponse.statusText);
      throw new Error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log('✅ Firecrawl response received:', JSON.stringify(firecrawlData, null, 2));

    // ✅ PROCESSAMENTO CORRIGIDO DA RESPOSTA V2
    if (!firecrawlData.success) {
      console.error('❌ Firecrawl returned success=false:', firecrawlData);
      throw new Error(`Firecrawl failed: ${firecrawlData.error || 'Unknown error'}`);
    }

    // Para v2, sempre verificar se existe data
    if (!firecrawlData.data) {
      throw new Error('No data returned from Firecrawl');
    }

    // Processar resultados - v2 sempre retorna 'data'
    let results;
    if (mode === 'scrape') {
      // Para scrape, data contém o conteúdo diretamente
      // Verificar se tem markdown no objeto principal ou na estrutura formats
      const dataItem = firecrawlData.data;
      if (dataItem.formats?.markdown) {
        results = [{ ...dataItem, markdown: dataItem.formats.markdown }];
      } else if (dataItem.markdown) {
        results = [dataItem];
      } else {
        throw new Error('No markdown content found in scrape response');
      }
    } else {
      // Para crawl, data é um array de objetos
      if (Array.isArray(firecrawlData.data)) {
        results = firecrawlData.data.map(item => {
          // Garantir que o markdown está no local correto
          if (item.formats?.markdown && !item.markdown) {
            return { ...item, markdown: item.formats.markdown };
          }
          return item;
        });
      } else {
        results = [firecrawlData.data];
      }
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
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Log adicional para debug
    console.error('❌ Request URL:', req.url);
    console.error('❌ Request method:', req.method);
    
    let errorMessage = 'Unknown error occurred';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack
      };
    } else {
      errorMessage = String(error);
    }
    
    // Resposta de erro melhorada
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      endpoint: 'firecrawl-scrape',
      debug: {
        hasFirecrawlKey: !!firecrawlApiKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseServiceKey
      }
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});