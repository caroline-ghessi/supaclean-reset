import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;

interface FirecrawlRequest {
  url: string;
  agentCategory: string;
  mode: 'scrape' | 'crawl';
  options?: {
    maxDepth?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
    formats?: string[];
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { url, agentCategory, mode, options = {} } = await req.json() as FirecrawlRequest;

    console.log(`🔥 Starting Firecrawl ${mode} for URL: ${url}, Agent: ${agentCategory}`);

    // Prepare Firecrawl API request for v2
    const firecrawlEndpoint = mode === 'scrape' 
      ? 'https://api.firecrawl.dev/v2/scrape'
      : 'https://api.firecrawl.dev/v2/crawl';

    // Start with minimal payload for v2 compatibility
    const firecrawlPayload: any = {
      url,
      formats: options.formats || ['markdown', 'html']
    };

    // Add common scraping parameters (all at root level for v2)
    if (mode === 'scrape') {
      firecrawlPayload.onlyMainContent = true;
      firecrawlPayload.includeTags = ['article', 'main', 'content', 'post', 'div', 'section'];
      firecrawlPayload.excludeTags = ['nav', 'footer', 'aside', 'ad', 'script', 'style', 'header'];
      firecrawlPayload.removeBase64Images = true;
      firecrawlPayload.waitFor = 2000;
      firecrawlPayload.headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      firecrawlPayload.actions = [
        {
          type: 'wait',
          milliseconds: 2000
        }
      ];
    }

    if (mode === 'crawl') {
      firecrawlPayload.limit = 50;
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
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify(firecrawlPayload),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('❌ Firecrawl API error:', errorText);
      throw new Error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log('✅ Firecrawl response received');
    console.log('📊 Response structure:', JSON.stringify(firecrawlData, null, 2));

    // Process results - handle v2 response structure
    const results = mode === 'scrape' ? [firecrawlData.data] : firecrawlData.data;
    const processedFiles: any[] = [];

    for (const [index, item] of results.entries()) {
      console.log(`📝 Processing item ${index + 1}:`, {
        hasMarkdown: !!item.markdown,
        markdownLength: item.markdown?.length || 0,
        markdownPreview: item.markdown?.substring(0, 200) || 'No markdown',
        metadata: item.metadata
      });

      // More lenient validation - reduced from 100 to 30 chars
      if (!item.markdown || item.markdown.trim().length < 30) {
        console.log(`⚠️ Skipping item ${index + 1}: insufficient content (${item.markdown?.length || 0} chars)`);
        continue;
      }

      // Generate filename
      const title = item.metadata?.title || item.metadata?.og?.title || 'Extracted Content';
      const sanitizedTitle = title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      const fileName = `${sanitizedTitle}_${Date.now()}.md`;
      const storagePath = `${agentCategory}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-knowledge')
        .upload(storagePath, new Blob([item.markdown], { type: 'text/markdown' }));

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        continue;
      }

      // Save to database
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
            source_url: item.metadata?.sourceURL || url,
            title: title,
            description: item.metadata?.description,
            scraped_at: new Date().toISOString(),
            firecrawl_metadata: item.metadata,
            confidence_score: 1.0,
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        continue;
      }

      console.log(`✅ Processed: ${fileName}`);
      processedFiles.push(fileRecord);

      // Generate embeddings in background
      EdgeRuntime.waitUntil(
        supabase.functions.invoke('generate-embeddings', {
          body: { fileId: fileRecord.id }
        })
      );
    }

    console.log(`🎉 Successfully processed ${processedFiles.length} files`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${processedFiles.length} ${mode === 'scrape' ? 'page' : 'pages'} from ${url}`,
        processedFiles: processedFiles.length,
        files: processedFiles,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Firecrawl scrape error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});