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
    const { conversationId, newCategory, force = false } = await req.json();

    if (!conversationId) {
      throw new Error('conversationId is required');
    }

    console.log(`🔄 Managing agent handoff for conversation: ${conversationId}, category: ${newCategory}`);

    // Buscar dados atuais da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id, 
        product_group, 
        current_agent_id,
        whatsapp_number,
        customer_name
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    const currentCategory = conversation.product_group;
    const currentAgentId = conversation.current_agent_id;
    
    // Usar categoria fornecida ou categoria atual da conversa
    const targetCategory = newCategory || currentCategory;

    console.log(`Current: agent=${currentAgentId}, category=${currentCategory} | Target: category=${targetCategory}`);

    // Encontrar o melhor agente para a categoria alvo
    const bestAgent = await findBestAgentForCategory(targetCategory);
    
    if (!bestAgent) {
      throw new Error(`No suitable agent found for category: ${targetCategory}`);
    }

    let handoffResult = {
      conversationId,
      oldAgentId: currentAgentId,
      newAgentId: bestAgent.id,
      oldCategory: currentCategory,
      newCategory: targetCategory,
      agentChanged: currentAgentId !== bestAgent.id,
      categoryChanged: currentCategory !== targetCategory,
      bestAgentName: bestAgent.agent_name,
      bestAgentType: bestAgent.agent_type,
      handoffPerformed: false
    };

    // Decidir se fazer handoff
    const shouldPerformHandoff = force || 
      handoffResult.agentChanged || 
      handoffResult.categoryChanged ||
      !currentAgentId;

    if (shouldPerformHandoff) {
      console.log(`🔄 Performing handoff: ${currentAgentId || 'none'} → ${bestAgent.id}`);

      // Atualizar conversa com novo agente e categoria
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          current_agent_id: bestAgent.id,
          product_group: targetCategory,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (updateError) {
        throw new Error(`Failed to update conversation: ${updateError.message}`);
      }

      handoffResult.handoffPerformed = true;

      // Log do handoff
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'agent-handoff-manager',
        message: 'Agent handoff performed',
        data: {
          ...handoffResult,
          customer: conversation.customer_name,
          phone: conversation.whatsapp_number,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`✅ Handoff completed successfully`);
    } else {
      console.log(`ℹ️ No handoff needed - agent and category are already correct`);
    }

    return new Response(JSON.stringify(handoffResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error managing agent handoff:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'agent-handoff-manager',
      message: 'Agent handoff failed',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ 
      error: error.message,
      handoffPerformed: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função para encontrar o melhor agente para uma categoria
async function findBestAgentForCategory(category: string) {
  try {
    console.log(`🔍 Finding best agent for category: ${category}`);

    // Para categorias específicas, tentar encontrar especialista primeiro
    if (category && !['indefinido', 'saudacao', 'institucional'].includes(category)) {
      const { data: specialist, error: specialistError } = await supabase
        .from('agent_configs')
        .select('id, agent_name, agent_type, product_category, system_prompt')
        .eq('agent_type', 'specialist')
        .eq('product_category', category)
        .eq('is_active', true)
        .single();
      
      if (!specialistError && specialist) {
        console.log(`🎯 Found specialist: ${specialist.agent_name} for ${category}`);
        return specialist;
      } else {
        console.log(`⚠️ No specialist found for ${category}, falling back to general agent`);
      }
    }
    
    // Fallback: buscar agente geral
    const { data: generalAgent, error: generalError } = await supabase
      .from('agent_configs')
      .select('id, agent_name, agent_type, product_category, system_prompt')
      .eq('agent_type', 'general')
      .eq('is_active', true)
      .single();
    
    if (generalError || !generalAgent) {
      throw new Error('No general agent available');
    }

    console.log(`📞 Using general agent: ${generalAgent.agent_name}`);
    return generalAgent;

  } catch (error) {
    console.error('Error finding best agent:', error);
    throw error;
  }
}