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
      extractedContent = await processPDF(fileBuffer, fileRecord.file_name, fileRecord.agent_category);
    } else if (fileRecord.file_type.includes('spreadsheet') || fileRecord.file_type.includes('excel') || fileRecord.file_name.endsWith('.xlsx') || fileRecord.file_name.endsWith('.xls')) {
      const result = await processExcel(fileBuffer, fileRecord.file_name, fileRecord.agent_category);
      extractedContent = result.content;
      metadata = result.metadata;
    } else if (fileRecord.file_type.includes('wordprocessingml') || fileRecord.file_name.endsWith('.docx')) {
      extractedContent = await processWord(fileBuffer, fileRecord.file_name, fileRecord.agent_category);
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

    // Start background task to generate embeddings (don't await to not block response)
    supabase.functions.invoke('generate-embeddings', {
      body: { fileId, content: extractedContent }
    }).catch(error => {
      console.error('❌ Failed to generate embeddings:', error);
    });

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

// LLM-powered text cleaning and structuring
async function cleanTextWithLLM(rawText: string, fileName: string, agentCategory?: string): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  // Create specialized prompt based on agent category
  const prompt = `Limpe e estruture este texto extraído do arquivo "${fileName}". Foque em:
${agentCategory === 'energia_solar' ? '- Especificações técnicas de painéis solares, inversores, baterias\n- Dados de potência, eficiência e dimensões\n- Informações de instalação e manutenção\n- Técnicas de vendas para energia solar' : '- Informações técnicas e especificações\n- Dados importantes de produtos\n- Instruções e procedimentos\n- Informações comerciais relevantes'}

Remova caracteres especiais, organize em seções lógicas e mantenha todas as informações importantes.
Retorne apenas o texto limpo e bem estruturado, sem comentários adicionais.

Texto para processar:
${rawText}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const cleanedText = data.choices[0]?.message?.content;

    if (!cleanedText) {
      throw new Error('No content returned from LLM');
    }

    console.log(`✅ Successfully cleaned text: ${cleanedText.length} characters`);
    return cleanedText;

  } catch (error) {
    console.error('LLM cleaning failed:', error);
    // Return original text if cleaning fails
    return rawText;
  }
}

// Basic PDF text extraction using pattern matching
async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('📄 Extracting PDF text using basic pattern matching...');
    const uint8Array = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // Extract text between common PDF text markers
    const textPatterns = [
      /\(([^)]+)\)/g,  // Text in parentheses
      /BT\s+([^ET]+)ET/g,  // Text between BT and ET markers
      /Tj\s*(.+)/g,    // Text with Tj operator
      /TJ\s*\[([^\]]+)\]/g  // Text arrays with TJ operator
    ];
    
    let extractedText = '';
    
    // Try different extraction patterns
    for (const pattern of textPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        extractedText += matches.join(' ') + ' ';
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/[^\w\s\u00C0-\u017F.,;:!?()-]/g, ' ') // Keep only readable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (!extractedText || extractedText.length < 50) {
      // Fallback: extract any readable text sequences
      const readableText = text.match(/[A-Za-z\u00C0-\u017F][A-Za-z\u00C0-\u017F\s.,;:!?()-]{10,}/g);
      if (readableText) {
        extractedText = readableText.join(' ').substring(0, 5000);
      }
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No readable text found in PDF');
    }
    
    console.log(`✅ Successfully extracted ${extractedText.length} characters from PDF`);
    return extractedText;
  } catch (error) {
    console.error('Basic PDF extraction failed:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

// PDF Processing - Extract text then clean with LLM
async function processPDF(buffer: ArrayBuffer, fileName: string, agentCategory?: string): Promise<string> {
  try {
    // Step 1: Extract raw text using Deno PDF library
    const rawText = await extractPDFText(buffer);
    
    // Step 2: Clean and structure with GPT-4o
    const cleanedText = await cleanTextWithLLM(rawText, fileName, agentCategory);
    
    return cleanedText;
  } catch (error) {
    console.error('PDF processing failed:', error);
    throw error;
  }
}

// Excel Processing - Use native library + LLM cleaning
async function processExcel(buffer: ArrayBuffer, fileName: string, agentCategory?: string): Promise<{ content: string; metadata: any }> {
  try {
    // For now, use a simple text extraction approach for Excel
    // TODO: Implement proper Excel parsing with XLSX library
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    const cleanedContent = await cleanTextWithLLM(text, fileName, agentCategory);
    
    const metadata = {
      extractionMethod: 'Native + LLM',
      processedAt: new Date().toISOString(),
      contentLength: cleanedContent.length
    };
    return { content: cleanedContent, metadata };
  } catch (error) {
    console.error('Error processing Excel:', error);
    return { 
      content: 'Excel file could not be processed', 
      metadata: { error: error.message } 
    };
  }
}

// Word Processing - Use native library + LLM cleaning
async function processWord(buffer: ArrayBuffer, fileName: string, agentCategory?: string): Promise<string> {
  try {
    // For now, use a simple text extraction approach for Word
    // TODO: Implement proper Word parsing with mammoth library
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    return await cleanTextWithLLM(text, fileName, agentCategory);
  } catch (error) {
    console.error('Error processing Word:', error);
    return 'Word file could not be processed';
  }
}