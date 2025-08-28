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

// LLM-powered text extraction
async function extractTextWithLLM(buffer: ArrayBuffer, fileType: string, fileName: string, agentCategory?: string): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Convert buffer to base64 for transmission
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  
  // Create specialized prompt based on file type and agent category
  const prompts = {
    'application/pdf': `Extraia todo o texto legível deste documento PDF. Foque em:
${agentCategory === 'energia_solar' ? '- Especificações técnicas de painéis solares, inversores, baterias\n- Dados de potência, eficiência e dimensões\n- Informações de instalação e manutenção' : '- Informações técnicas e especificações\n- Dados importantes de produtos\n- Instruções e procedimentos'}

Retorne apenas o texto extraído, bem estruturado e limpo, sem comentários adicionais.`,
    
    'wordprocessingml': `Extraia todo o conteúdo textual deste documento Word. Mantenha a estrutura e formatação importantes como:
- Títulos e seções
- Listas e tabelas
- Especificações técnicas
- Dados numéricos importantes

Retorne o texto limpo e bem organizado.`,
    
    'spreadsheet': `Extraia os dados desta planilha Excel, incluindo:
- Cabeçalhos de colunas
- Dados das células
- Nomes de planilhas
- Informações importantes em tabelas

Organize os dados de forma estruturada e legível.`
  };

  // Determine prompt type
  let promptType = 'application/pdf';
  if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
    promptType = 'wordprocessingml';
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    promptType = 'spreadsheet';
  }

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
            content: [
              {
                type: 'text',
                text: prompts[promptType]
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content;

    if (!extractedText) {
      throw new Error('No content extracted from file');
    }

    console.log(`✅ Successfully extracted ${extractedText.length} characters using LLM`);
    return extractedText;

  } catch (error) {
    console.error('LLM extraction failed:', error);
    // Fallback to basic extraction for PDFs
    if (fileType === 'application/pdf') {
      return await processPDFFallback(buffer);
    }
    throw error;
  }
}

// Fallback PDF processing
async function processPDFFallback(buffer: ArrayBuffer): Promise<string> {
  console.log('⚠️ Using fallback PDF extraction');
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  
  // Try to extract readable text patterns
  const lines = text.split('\n').filter(line => {
    const cleanLine = line.trim();
    return cleanLine.length > 3 && 
           /[a-zA-Z]/.test(cleanLine) && 
           !cleanLine.startsWith('%') &&
           !cleanLine.includes('obj') &&
           !cleanLine.includes('endobj');
  });
  
  return lines.join(' ').substring(0, 5000) || 'PDF content could not be extracted properly';
}

// PDF Processing
async function processPDF(buffer: ArrayBuffer, fileName: string, agentCategory?: string): Promise<string> {
  return await extractTextWithLLM(buffer, 'application/pdf', fileName, agentCategory);
}

// Excel Processing
async function processExcel(buffer: ArrayBuffer, fileName: string, agentCategory?: string): Promise<{ content: string; metadata: any }> {
  try {
    const content = await extractTextWithLLM(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName, agentCategory);
    const metadata = {
      extractionMethod: 'LLM',
      processedAt: new Date().toISOString(),
      contentLength: content.length
    };
    return { content, metadata };
  } catch (error) {
    console.error('Error processing Excel:', error);
    return { 
      content: 'Excel file could not be processed with LLM', 
      metadata: { error: error.message } 
    };
  }
}

// Word Processing
async function processWord(buffer: ArrayBuffer, fileName: string, agentCategory?: string): Promise<string> {
  try {
    return await extractTextWithLLM(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileName, agentCategory);
  } catch (error) {
    console.error('Error processing Word:', error);
    return 'Word file could not be processed with LLM';
  }
}