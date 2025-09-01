import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar dados da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar contexto do projeto
    const { data: projectContext } = await supabase
      .from('project_contexts')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    // 3. Buscar contextos extraídos
    const { data: extractedContexts } = await supabase
      .from('extracted_contexts')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_active', true);

    // 4. Buscar mensagens com mídia
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // 5. Identificar arquivos de mídia
    const mediaFiles = messages?.filter(msg => msg.media_url && msg.media_type) || [];
    const mediaLinks = mediaFiles.map(file => ({
      type: file.media_type,
      url: file.media_url,
      timestamp: file.created_at
    }));

    // 6. Buscar agente de resumos
    const { data: summarizerAgent } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'summarizer')
      .eq('is_active', true)
      .single();

    if (!summarizerAgent) {
      return new Response(
        JSON.stringify({ error: 'Agente de resumos não encontrado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Preparar dados para o prompt
    const conversationHistory = messages?.filter(msg => msg.sender_type === 'customer')
      .map(msg => `${msg.sender_name || 'Cliente'}: ${msg.content}`)
      .join('\n') || 'Nenhuma mensagem do cliente';

    const contextData = {
      // Dados básicos
      nome: conversation.customer_name || 'Não informado',
      whatsapp: conversation.whatsapp_number || 'Não informado',
      email: conversation.customer_email || 'Não informado',
      cidade: conversation.customer_city || 'Não informado',
      estado: conversation.customer_state || 'Não informado',
      
      // Classificação
      produto_grupo: conversation.product_group || 'Não classificado',
      temperatura: conversation.lead_temperature || 'Não avaliado',
      score: conversation.lead_score || 0,
      
      // Contexto do projeto
      urgencia: projectContext?.urgency || 'Não informado',
      orcamento: projectContext?.budget_range || 'Não informado',
      timeline: projectContext?.timeline || 'Não informado',
      necessidades: projectContext?.desired_product || 'Não informado',
      
      // Histórico e arquivos
      principais_pontos_discutidos: conversationHistory,
      links_para_arquivos: mediaLinks.length > 0 
        ? mediaLinks.map(link => `${link.type}: ${link.url}`).join('\n')
        : 'Nenhum arquivo enviado'
    };

    // 8. Gerar resumo usando LLM
    const promptWithData = summarizerAgent.system_prompt.replace(
      /\{(\w+)\}/g,
      (match, key) => contextData[key as keyof typeof contextData]?.toString() || match
    );

    // Preparar dados contextuais adicionais
    const additionalContext = [
      `Dados extraídos: ${JSON.stringify(extractedContexts || [])}`,
      `Total de mensagens: ${messages?.length || 0}`,
      `Arquivos enviados: ${mediaFiles.length}`,
      `Contexto do projeto: ${JSON.stringify(projectContext || {})}`
    ].join('\n');

    const llmPrompt = `${promptWithData}\n\nCONTEXTO ADICIONAL:\n${additionalContext}\n\nGere um resumo completo e estruturado baseado nos dados acima.`;

    // 9. Chamar LLM (usando OpenAI)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: llmPrompt },
          { role: 'user', content: 'Gere o resumo baseado nos dados fornecidos.' }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    const llmData = await llmResponse.json();
    const summary = llmData.choices?.[0]?.message?.content || 'Erro ao gerar resumo';

    // 10. Log da geração
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'generate-lead-summary',
      message: 'Resumo gerado com sucesso',
      data: {
        conversation_id: conversationId,
        summary_length: summary.length,
        media_files_count: mediaFiles.length
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        conversation,
        mediaFiles: mediaLinks,
        contextData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar resumo:', error);

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'generate-lead-summary',
      message: 'Erro ao gerar resumo',
      data: { error: error.message }
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});