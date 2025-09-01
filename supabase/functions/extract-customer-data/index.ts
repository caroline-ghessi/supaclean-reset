import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      throw new Error('ConversationId and message are required');
    }

    console.log('Extracting customer data for conversation:', conversationId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get extractor agent configuration from new table
    const { data: extractorAgent, error: agentError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'extractor')
      .eq('is_active', true)
      .single();

    if (agentError || !extractorAgent) {
      console.error('Failed to load extractor agent:', agentError);
      throw new Error('Extractor agent not configured');
    }

    // Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error(`Failed to get messages: ${messagesError.message}`);
    }

    // Build conversation history
    const conversationHistory = messages.map(msg => 
      `${msg.sender_type === 'customer' ? 'Cliente' : 'Atendente'}: ${msg.content}`
    ).join('\n');

    // Use the system prompt directly with conversation context
    const fullPrompt = `${extractorAgent.system_prompt}

Histórico da conversa:
${conversationHistory}

Última mensagem: "${message}"`;

    // Get appropriate API key based on configured LLM
    let apiKey = '';
    let apiUrl = '';
    let headers = {};
    let requestBody = {};

    const llmModel = extractorAgent.llm_model || 'claude-3-5-sonnet-20241022';
    
    if (llmModel.startsWith('claude')) {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) throw new Error('Anthropic API key not configured');
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      requestBody = {
        model: llmModel,
        max_tokens: 2000,
        messages: [{ role: 'user', content: fullPrompt }]
      };
    } else if (llmModel.startsWith('gpt')) {
      apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) throw new Error('OpenAI API key not configured');
      
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: llmModel,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 2000
      };
    } else if (llmModel.startsWith('grok')) {
      apiKey = Deno.env.get('XAI_API_KEY');
      if (!apiKey) throw new Error('xAI API key not configured');
      
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: llmModel,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 2000
      };
    } else {
      throw new Error(`Unsupported LLM model: ${llmModel}`);
    }

    // Call the configured LLM API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract data based on LLM type
    let extractedDataText = '';
    if (llmModel.startsWith('claude')) {
      extractedDataText = data.content[0].text.trim();
    } else if (llmModel.startsWith('gpt') || llmModel.startsWith('grok')) {
      extractedDataText = data.choices[0].message.content.trim();
    }

    console.log('Raw extraction result:', extractedDataText);

    // Try to parse as JSON
    let extractedData = {};
    try {
      extractedData = JSON.parse(extractedDataText);
    } catch (parseError) {
      console.warn('Failed to parse extracted data as JSON:', parseError);
      // Try to extract basic information even if not JSON
      extractedData = {
        raw_response: extractedDataText
      };
    }

    console.log('Parsed extracted data:', extractedData);

    // Update project context and conversation data
    const contextData = {
      conversation_id: conversationId,
      whatsapp_confirmed: extractedData.whatsapp || extractedData.telefone || null,
      energy_consumption: extractedData['Consumo de energia'] || extractedData.energy_consumption || null,
      roof_status: extractedData['Estado do telhado'] || extractedData.roof_status || null,
      project_status: extractedData['Projeto arquitetônico'] || extractedData.project_status || null,
      floor_rooms: extractedData['Quantidade de piso'] || extractedData.floor_rooms || null,
      materials_list: extractedData['Lista de materiais'] ? [extractedData['Lista de materiais']] : null,
      desired_product: extractedData['Produto desejado'] || extractedData.desired_product || null,
      notes: `Dados extraídos: ${JSON.stringify(extractedData)}`,
      updated_at: new Date().toISOString()
    };

    // Upsert project context
    await supabase
      .from('project_contexts')
      .upsert(contextData, {
        onConflict: 'conversation_id'
      });

    // Update conversation data if available
    const conversationUpdates: any = {};
    if (extractedData.nome || extractedData.name) {
      conversationUpdates.customer_name = extractedData.nome || extractedData.name;
    }
    if (extractedData.email) {
      conversationUpdates.customer_email = extractedData.email;
    }
    if (extractedData.cidade || extractedData.city) {
      conversationUpdates.customer_city = extractedData.cidade || extractedData.city;
    }
    if (extractedData.estado || extractedData.state) {
      conversationUpdates.customer_state = extractedData.estado || extractedData.state;
    }

    if (Object.keys(conversationUpdates).length > 0) {
      await supabase
        .from('conversations')
        .update(conversationUpdates)
        .eq('id', conversationId);
    }

    return new Response(JSON.stringify({
      customerData: extractedData,
      contextUpdated: true,
      llmModel: llmModel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error extracting customer data:', error);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'extract-customer-data',
      message: 'Failed to extract customer data',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({
      customerData: {},
      contextUpdated: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});