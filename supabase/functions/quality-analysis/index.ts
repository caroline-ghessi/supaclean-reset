import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { conversationId, vendorId, forceAnalysis = false } = await req.json();

    if (!conversationId || !vendorId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and vendorId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar agente de qualidade ativo
    const { data: qualityAgent, error: agentError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'quality_monitor')
      .eq('is_active', true)
      .single();

    if (agentError || !qualityAgent) {
      console.log('No active quality monitor agent found');
      return new Response(
        JSON.stringify({ error: 'No active quality monitor agent configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a conversa já foi analisada recentemente
    if (!forceAnalysis) {
      const { data: existingAnalysis } = await supabase
        .from('vendor_quality_analysis')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('vendor_id', vendorId)
        .gte('analyzed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
        .single();

      if (existingAnalysis) {
        return new Response(
          JSON.stringify({ message: 'Conversation already analyzed in the last 24 hours' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar mensagens da conversa
    const { data: messages, error: messagesError } = await supabase
      .from('vendor_messages')
      .select(`
        id,
        content,
        from_me,
        timestamp_whatsapp,
        from_name,
        message_type
      `)
      .eq('conversation_id', conversationId)
      .eq('vendor_id', vendorId)
      .order('timestamp_whatsapp', { ascending: true });

    if (messagesError || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages found for analysis' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar informações do vendedor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('name, phone_number')
      .eq('id', vendorId)
      .single();

    // Preparar contexto da conversa para análise
    const conversationContext = {
      vendor: vendor || { name: 'Vendedor', phone_number: 'N/A' },
      messages: messages.map(msg => ({
        content: msg.content,
        from_vendor: msg.from_me,
        timestamp: msg.timestamp_whatsapp,
        from_name: msg.from_name || (msg.from_me ? vendor?.name : 'Cliente'),
        type: msg.message_type
      })),
      conversation_stats: {
        total_messages: messages.length,
        vendor_messages: messages.filter(m => m.from_me).length,
        customer_messages: messages.filter(m => !m.from_me).length,
        duration_hours: messages.length > 1 
          ? (new Date(messages[messages.length - 1].timestamp_whatsapp).getTime() - 
             new Date(messages[0].timestamp_whatsapp).getTime()) / (1000 * 60 * 60)
          : 0
      }
    };

    // Calcular tempo de resposta médio
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      // Se a mensagem anterior foi do cliente e a atual é do vendedor
      if (!previous.from_me && current.from_me) {
        const responseTimeMs = new Date(current.timestamp_whatsapp).getTime() - 
                              new Date(previous.timestamp_whatsapp).getTime();
        totalResponseTime += responseTimeMs;
        responseCount++;
      }
    }
    
    const avgResponseTimeMinutes = responseCount > 0 
      ? totalResponseTime / (responseCount * 1000 * 60) 
      : 0;

    // Preparar prompt para análise
    const analysisPrompt = `${qualityAgent.system_prompt}

## CONTEXTO DA CONVERSA
Vendedor: ${conversationContext.vendor.name}
Total de mensagens: ${conversationContext.conversation_stats.total_messages}
Mensagens do vendedor: ${conversationContext.conversation_stats.vendor_messages}
Mensagens do cliente: ${conversationContext.conversation_stats.customer_messages}
Duração da conversa: ${conversationContext.conversation_stats.duration_hours.toFixed(2)}h
Tempo médio de resposta: ${avgResponseTimeMinutes.toFixed(1)} minutos

## MENSAGENS DA CONVERSA
${conversationContext.messages.map(msg => 
  `[${new Date(msg.timestamp).toLocaleString('pt-BR')}] ${msg.from_name}: ${msg.content}`
).join('\n')}

Analise esta conversa seguindo os critérios estabelecidos e retorne apenas o JSON solicitado.`;

    // Fazer requisição para o modelo de IA
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: qualityAgent.llm_model || 'claude-3-5-sonnet-20241022',
        max_tokens: qualityAgent.max_tokens || 1000,
        temperature: qualityAgent.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze conversation', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    
    let analysisResult;
    try {
      const content = aiResult.content[0].text;
      // Extrair JSON do conteúdo da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI analysis', details: String(parseError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar análise no banco de dados
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('vendor_quality_analysis')
      .insert({
        vendor_id: vendorId,
        conversation_id: conversationId,
        analysis_data: analysisResult,
        quality_score: analysisResult.overall_score || 0,
        criteria_scores: analysisResult.criteria_scores || {},
        issues_identified: analysisResult.issues_identified || [],
        recommendations: analysisResult.recommendations || [],
        agent_id: qualityAgent.id,
        analyzed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar alertas se necessário
    const alerts = analysisResult.alerts || [];
    if (alerts.length > 0) {
      const alertInserts = alerts.map((alert: any) => ({
        vendor_id: vendorId,
        analysis_id: savedAnalysis.id,
        alert_type: alert.type,
        severity: alert.severity,
        title: `Alerta de Qualidade: ${alert.type}`,
        description: alert.message,
        metadata: { conversation_id: conversationId }
      }));

      await supabase
        .from('quality_alerts')
        .insert(alertInserts);
    }

    // Atualizar quality_metrics se existir
    const today = new Date().toISOString().split('T')[0];
    const { error: metricsError } = await supabase
      .from('quality_metrics')
      .upsert({
        vendor_id: vendorId,
        conversation_id: conversationId,
        metric_date: today,
        response_time_avg_minutes: Math.round(avgResponseTimeMinutes),
        automated_quality_score: analysisResult.overall_score,
        total_messages_sent: conversationContext.conversation_stats.vendor_messages,
        total_messages_received: conversationContext.conversation_stats.customer_messages,
        flags: { ai_analysis_completed: true }
      }, {
        onConflict: 'vendor_id,conversation_id,metric_date'
      });

    if (metricsError) {
      console.error('Failed to update quality metrics:', metricsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
        alerts_generated: alerts.length,
        avg_response_time_minutes: avgResponseTimeMinutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Quality analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});