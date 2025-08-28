import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getDocument } from 'https://deno.land/x/pdfjs@2.11.338/mod.ts';

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

// Validate if extracted text is readable
function isTextReadable(text: string): boolean {
  if (!text || text.length < 50) return false;
  
  // Count alphanumeric characters vs total characters
  const alphanumericCount = (text.match(/[a-zA-Z0-9\u00C0-\u017F]/g) || []).length;
  const readabilityRatio = alphanumericCount / text.length;
  
  // At least 70% should be readable characters
  return readabilityRatio > 0.7;
}

// Advanced PDF text extraction using PDF.js
async function extractPDFTextAdvanced(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('📄 Extracting PDF text using PDF.js library...');
    
    const uint8Array = new Uint8Array(buffer);
    const doc = await getDocument({ data: uint8Array }).promise;
    
    let fullText = '';
    const numPages = doc.numPages;
    console.log(`📑 PDF has ${numPages} pages`);
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      
      if (pageNum % 5 === 0) {
        console.log(`📄 Processed ${pageNum}/${numPages} pages...`);
      }
    }
    
    // Clean up extracted text
    fullText = fullText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    console.log(`✅ Successfully extracted ${fullText.length} characters using PDF.js`);
    return fullText;
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    throw new Error(`Advanced PDF extraction failed: ${error.message}`);
  }
}

// Fallback PDF text extraction using pattern matching (improved)
async function extractPDFTextFallback(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('📄 Using fallback PDF extraction method...');
    const uint8Array = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // Look for stream objects containing text
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
    let extractedText = '';
    let match;
    
    while ((match = streamPattern.exec(text)) !== null) {
      const streamContent = match[1];
      
      // Extract readable text sequences from stream
      const readableText = streamContent.match(/[A-Za-z\u00C0-\u017F][A-Za-z0-9\u00C0-\u017F\s.,;:!?\-()]{5,}/g);
      if (readableText) {
        extractedText += readableText.join(' ') + ' ';
      }
    }
    
    // Also try extracting from text between parentheses (common PDF format)
    const textInParentheses = text.match(/\(([^)]{3,})\)/g);
    if (textInParentheses) {
      const cleanParenthesesText = textInParentheses
        .map(match => match.slice(1, -1)) // Remove parentheses
        .filter(str => str.length > 2)
        .join(' ');
      extractedText += ' ' + cleanParenthesesText;
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/[^\w\s\u00C0-\u017F.,;:!?\-()]/g, ' ') // Keep only readable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    console.log(`✅ Fallback extraction yielded ${extractedText.length} characters`);
    return extractedText;
  } catch (error) {
    console.error('Fallback PDF extraction failed:', error);
    throw new Error(`Fallback PDF extraction failed: ${error.message}`);
  }
}

// Main PDF text extraction with multiple strategies
async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  const strategies = [
    { name: 'PDF.js', func: extractPDFTextAdvanced },
    { name: 'Fallback', func: extractPDFTextFallback }
  ];
  
  for (const strategy of strategies) {
    try {
      console.log(`🔄 Trying ${strategy.name} extraction strategy...`);
      const extractedText = await strategy.func(buffer);
      
      // Validate if the extracted text is readable
      if (isTextReadable(extractedText)) {
        console.log(`✅ ${strategy.name} extraction successful and readable`);
        return extractedText;
      } else {
        console.warn(`⚠️ ${strategy.name} extraction produced unreadable text`);
        console.log(`First 200 chars: ${extractedText.substring(0, 200)}`);
      }
    } catch (error) {
      console.warn(`⚠️ ${strategy.name} extraction failed:`, error.message);
    }
  }
  
  throw new Error('All PDF extraction strategies failed to produce readable text');
}

// PDF Processing - Extract text then clean with LLM
async function processPDF(buffer: ArrayBuffer, fileName: string, agentCategory?: string): Promise<string> {
  try {
    // Step 1: Extract raw text using multiple strategies
    const rawText = await extractPDFText(buffer);
    
    // Step 2: Validate and potentially split large content before LLM processing
    let textToProcess = rawText;
    
    // If text is too large for LLM (>50k chars), take a representative sample
    if (rawText.length > 50000) {
      console.log(`📄 Text too large (${rawText.length} chars), taking representative sample`);
      // Take first 20k, middle 15k, and last 15k characters
      const first = rawText.substring(0, 20000);
      const middle = rawText.substring(Math.floor(rawText.length / 2) - 7500, Math.floor(rawText.length / 2) + 7500);
      const last = rawText.substring(rawText.length - 15000);
      textToProcess = first + '\n...\n' + middle + '\n...\n' + last;
      console.log(`📄 Sample text length: ${textToProcess.length} chars`);
    }
    
    // Step 3: Clean and structure with GPT-4o
    const cleanedText = await cleanTextWithLLM(textToProcess, fileName, agentCategory);
    
    // If we used a sample, mention this in the processed content
    if (rawText.length > 50000) {
      return `[Arquivo PDF grande processado - amostra representativa]\n\n${cleanedText}\n\n[Texto original continha ${rawText.length} caracteres]`;
    }
    
    return cleanedText;
  } catch (error) {
    console.error('PDF processing failed:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
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