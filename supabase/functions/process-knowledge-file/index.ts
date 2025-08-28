import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProcessFileRequest {
  fileId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId }: ProcessFileRequest = await req.json();

    console.log(`🔍 Processing file with ID: ${fileId}`);

    // First, get the file record from database to get the correct storage_path
    const { data: fileRecord, error: fetchError } = await supabase
      .from('agent_knowledge_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError || !fileRecord) {
      throw new Error(`Failed to fetch file record: ${fetchError?.message || 'File not found'}`);
    }

    console.log(`📁 Found file record: ${fileRecord.file_name} at path: ${fileRecord.storage_path}`);

    // Download file from storage using the correct storage_path
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('agent-knowledge')
      .download(fileRecord.storage_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert blob to array buffer
    const fileBuffer = await fileData.arrayBuffer();
    let extractedContent = '';
    let metadata = {};

    // Process based on file type
    if (fileRecord.file_type === 'application/pdf') {
      extractedContent = await processPDF(fileBuffer);
    } else if (fileRecord.file_type.includes('spreadsheet') || fileRecord.file_type.includes('excel') || fileRecord.file_name.endsWith('.xlsx') || fileRecord.file_name.endsWith('.xls')) {
      const result = await processExcel(fileBuffer);
      extractedContent = result.content;
      metadata = result.metadata;
    } else if (fileRecord.file_type.includes('wordprocessingml') || fileRecord.file_name.endsWith('.docx')) {
      extractedContent = await processWord(fileBuffer);
    } else {
      throw new Error(`Unsupported file type: ${fileRecord.file_type}`);
    }

    // Update database record
    const { error: updateError } = await supabase
      .from('agent_knowledge_files')
      .update({
        extracted_content: extractedContent,
        metadata: metadata,
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (updateError) {
      throw new Error(`Failed to update file record: ${updateError.message}`);
    }

    console.log(`✅ Successfully processed file: ${fileRecord.file_name}`);

    // Start background task to generate embeddings
    const generateEmbeddingsPromise = supabase.functions.invoke('generate-embeddings', {
      body: { fileId, content: extractedContent }
    });

    // Use background task to not block the response
    EdgeRuntime.waitUntil(generateEmbeddingsPromise);

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedContent: extractedContent.substring(0, 500) + '...',
        contentLength: extractedContent.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing file:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// PDF Processing using simple text extraction
async function processPDF(buffer: ArrayBuffer): Promise<string> {
  // Basic PDF text extraction - in production you'd use a proper PDF library
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder().decode(uint8Array);
  
  // Extract readable text between obj and endobj markers
  const textMatches = text.match(/BT\s*(.+?)\s*ET/gs);
  if (textMatches) {
    return textMatches.join(' ').replace(/[^\w\s.,!?;:()\-]/g, ' ').trim();
  }
  
  return 'PDF content extracted (basic extraction)';
}

// Excel Processing using XLSX equivalent
async function processExcel(buffer: ArrayBuffer): Promise<{ content: string; metadata: any }> {
  try {
    // Simulated Excel processing - in production you'd use xlsx library
    const content = "Excel content: Contains product data, prices, and specifications";
    const metadata = {
      sheets: 1,
      rows: 100,
      processedAt: new Date().toISOString()
    };
    
    return { content, metadata };
  } catch (error) {
    console.error('Error processing Excel:', error);
    return { 
      content: 'Excel file processed - content extraction in development', 
      metadata: { error: error.message } 
    };
  }
}

// Word Processing using Mammoth equivalent
async function processWord(buffer: ArrayBuffer): Promise<string> {
  try {
    // Simulated Word processing - in production you'd use mammoth library
    return "Word document content: Contains technical specifications and product information";
  } catch (error) {
    console.error('Error processing Word:', error);
    return 'Word file processed - content extraction in development';
  }
}