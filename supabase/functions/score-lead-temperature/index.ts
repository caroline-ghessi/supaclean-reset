import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      throw new Error('conversationId é obrigatório');
    }

    console.log(`🎯 Analisando leads para conversa: ${conversationId}`);

    // 1. Buscar conversa e mensagens
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversa não encontrada');
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      throw new Error('Erro ao buscar mensagens');
    }

    // 2. Buscar agente lead_scorer ativo
    const { data: leadScorerAgent } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'lead_scorer')
      .eq('is_active', true)
      .single();

    if (!leadScorerAgent) {
      console.log('⚠️ Nenhum agente lead_scorer encontrado, usando análise padrão');
      return await performBasicScoring(conversation, messages);
    }

    // 3. Analisar com IA
    const analysisResult = await analyzeWithAI(leadScorerAgent, conversation, messages);
    
    // 4. Atualizar conversa
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        lead_score: analysisResult.score,
        lead_temperature: analysisResult.temperature,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      throw new Error('Erro ao atualizar score da conversa');
    }

    // 5. Log da análise
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'score-lead-temperature',
      message: `Lead analisado: ${analysisResult.temperature} (${analysisResult.score})`,
      data: {
        conversationId,
        oldScore: conversation.lead_score,
        newScore: analysisResult.score,
        oldTemperature: conversation.lead_temperature,
        newTemperature: analysisResult.temperature,
        reasoning: analysisResult.reasoning
      }
    });

    console.log(`✅ Lead atualizado: ${analysisResult.temperature} (${analysisResult.score}/100)`);

    return new Response(JSON.stringify({
      success: true,
      conversationId,
      score: analysisResult.score,
      temperature: analysisResult.temperature,
      reasoning: analysisResult.reasoning
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no scoring de leads:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'score-lead-temperature',
      message: 'Erro no scoring de leads',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeWithAI(agent: any, conversation: any, messages: any[]) {
  const messagesText = messages
    .map(m => `[${m.sender_type}]: ${m.content}`)
    .join('\n');

  const analysisPrompt = `${agent.system_prompt}

CONVERSA PARA ANÁLISE:
Cliente: ${conversation.customer_name || conversation.whatsapp_number}
Categoria: ${conversation.product_group}
Últimas mensagens:
${messagesText}

INSTRUÇÃO: Analise esta conversa e retorne APENAS um JSON válido no formato:
{
  "score": number (0-100),
  "temperature": "cold" | "warm" | "hot",
  "reasoning": "explicação breve da análise"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: analysisPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Validar resultado
    const score = Math.min(100, Math.max(0, result.score));
    let temperature = result.temperature;
    
    if (!['cold', 'warm', 'hot'].includes(temperature)) {
      temperature = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
    }
    
    return {
      score,
      temperature,
      reasoning: result.reasoning || 'Análise por IA'
    };

  } catch (error) {
    console.error('Erro na análise com IA:', error);
    return await performBasicScoring(conversation, messages);
  }
}

async function performBasicScoring(conversation: any, messages: any[]) {
  let score = 0;
  const customerMessages = messages.filter(m => m.sender_type === 'customer');
  
  // Critérios básicos de scoring
  
  // 1. Frequência de mensagens (20 pontos)
  if (customerMessages.length >= 5) score += 20;
  else if (customerMessages.length >= 3) score += 10;
  else if (customerMessages.length >= 1) score += 5;
  
  // 2. Dados do cliente completos (25 pontos)
  if (conversation.customer_name) score += 10;
  if (conversation.customer_email) score += 10;
  if (conversation.customer_city) score += 5;
  
  // 3. Categoria definida (15 pontos)
  if (conversation.product_group && conversation.product_group !== 'indefinido') {
    score += 15;
  }
  
  // 4. Palavras de urgência nas mensagens (25 pontos)
  const urgencyWords = ['urgente', 'rápido', 'hoje', 'amanhã', 'preciso', 'precisa'];
  const messageText = customerMessages.map(m => m.content.toLowerCase()).join(' ');
  const urgencyCount = urgencyWords.filter(word => messageText.includes(word)).length;
  score += Math.min(25, urgencyCount * 8);
  
  // 5. Tempo desde última mensagem (15 pontos)
  if (conversation.last_message_at) {
    const hoursSinceLastMessage = (Date.now() - new Date(conversation.last_message_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastMessage < 1) score += 15;
    else if (hoursSinceLastMessage < 24) score += 10;
    else if (hoursSinceLastMessage < 72) score += 5;
  }
  
  // Determinar temperatura baseada no score
  let temperature: 'cold' | 'warm' | 'hot';
  if (score >= 70) temperature = 'hot';
  else if (score >= 40) temperature = 'warm';
  else temperature = 'cold';
  
  return {
    score,
    temperature,
    reasoning: 'Análise baseada em critérios automáticos: frequência de mensagens, completude de dados, categoria, urgência e tempo de resposta'
  };
}