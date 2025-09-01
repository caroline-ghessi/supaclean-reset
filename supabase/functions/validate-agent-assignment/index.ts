import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      throw new Error('conversationId is required');
    }

    console.log(`🔍 Validating agent assignment for conversation: ${conversationId}`);

    // Buscar dados da conversa e agente atual
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id, 
        product_group, 
        current_agent_id,
        whatsapp_number
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    let validationResult = {
      conversationId,
      currentCategory: conversation.product_group,
      currentAgentId: conversation.current_agent_id,
      isValid: false,
      recommendedAgentId: null,
      recommendedAgentName: null,
      issues: [] as string[]
    };

    // Se não há agente atual, sempre é problema
    if (!conversation.current_agent_id) {
      validationResult.issues.push('No agent assigned to conversation');
      
      // Buscar agente recomendado
      const recommendedAgent = await findBestAgent(conversation.product_group);
      if (recommendedAgent) {
        validationResult.recommendedAgentId = recommendedAgent.id;
        validationResult.recommendedAgentName = recommendedAgent.agent_name;
      }
    } else {
      // Buscar dados do agente atual
      const { data: currentAgent, error: agentError } = await supabase
        .from('agent_configs')
        .select('id, agent_name, agent_type, product_category, is_active')
        .eq('id', conversation.current_agent_id)
        .single();

      if (agentError || !currentAgent) {
        validationResult.issues.push('Current agent not found or inactive');
      } else if (!currentAgent.is_active) {
        validationResult.issues.push('Current agent is inactive');
      } else {
        // Verificar se o agente é apropriado para a categoria
        const category = conversation.product_group;
        const shouldBeSpecialist = category && !['indefinido', 'saudacao', 'institucional'].includes(category);
        
        if (shouldBeSpecialist) {
          // Deveria ser especialista
          if (currentAgent.agent_type !== 'specialist') {
            validationResult.issues.push(`Should use specialist agent for category ${category}, but using ${currentAgent.agent_type}`);
          } else if (currentAgent.product_category !== category) {
            validationResult.issues.push(`Agent specializes in ${currentAgent.product_category} but conversation is about ${category}`);
          } else {
            validationResult.isValid = true;
          }
        } else {
          // Deveria ser geral
          if (currentAgent.agent_type !== 'general') {
            validationResult.issues.push(`Should use general agent for category ${category}, but using ${currentAgent.agent_type}`);
          } else {
            validationResult.isValid = true;
          }
        }

        // Se há problemas, buscar agente recomendado
        if (!validationResult.isValid) {
          const recommendedAgent = await findBestAgent(category);
          if (recommendedAgent && recommendedAgent.id !== currentAgent.id) {
            validationResult.recommendedAgentId = recommendedAgent.id;
            validationResult.recommendedAgentName = recommendedAgent.agent_name;
          }
        }
      }
    }

    // Log dos resultados da validação
    if (!validationResult.isValid) {
      await supabase.from('system_logs').insert({
        level: 'warning',
        source: 'validate-agent-assignment',
        message: 'Agent assignment validation failed',
        data: validationResult
      });
    }

    console.log(`✅ Validation completed:`, validationResult);

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error validating agent assignment:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'validate-agent-assignment',
      message: 'Validation failed',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ 
      error: error.message,
      isValid: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função auxiliar para encontrar o melhor agente para uma categoria
async function findBestAgent(category: string) {
  try {
    // Se categoria específica, buscar especialista primeiro
    if (category && !['indefinido', 'saudacao', 'institucional'].includes(category)) {
      const { data: specialist } = await supabase
        .from('agent_configs')
        .select('id, agent_name, agent_type, product_category')
        .eq('agent_type', 'specialist')
        .eq('product_category', category)
        .eq('is_active', true)
        .single();
      
      if (specialist) {
        return specialist;
      }
    }
    
    // Fallback para agente geral
    const { data: general } = await supabase
      .from('agent_configs')
      .select('id, agent_name, agent_type, product_category')
      .eq('agent_type', 'general')
      .eq('is_active', true)
      .single();
    
    return general;
  } catch (error) {
    console.error('Error finding best agent:', error);
    return null;
  }
}