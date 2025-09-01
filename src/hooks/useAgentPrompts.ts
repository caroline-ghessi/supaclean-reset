import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/conversation.types';

// Hook to get agent prompt by category
export function useAgentPrompt(category: ProductCategory) {
  return useQuery({
    queryKey: ['agent-prompt', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_prompts')
        .select('*')
        .eq('category', category as any) // Type will be updated after DB sync
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    }
  });
}

// Hook to get all agent prompts
export function useAgentPrompts() {
  return useQuery({
    queryKey: ['agent-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_prompts')
        .select('*')
        .order('category');

      if (error) throw error;
      return data;
    }
  });
}

// Hook to get or create general agent
export function useGeneralAgent() {
  return useQuery({
    queryKey: ['general-agent'],
    queryFn: async () => {
      // First try to get existing general agent
      const { data, error } = await supabase
        .from('agent_prompts')
        .select('*')
        .eq('category', 'geral' as any) // Type will be updated after DB sync
        .eq('is_active', true)
        .single();

      if (error && error.code === 'PGRST116') {
        // No general agent found, create default one
        const defaultGeneralAgent = {
          category: 'geral' as any, // Type will be updated after DB sync
          name: 'Atendimento Geral',
          description: 'Agente responsável pelo atendimento inicial e casos não especializados',
          knowledge_base: `Você é um assistente de atendimento geral especializado em energia solar e construção civil.

## Sua função:
- Realizar atendimento inicial cordial e profissional
- Identificar as necessidades do cliente
- Direcionar para soluções adequadas
- Coletar informações importantes para orçamentos

## Contexto disponível:
- Nome do cliente: {{customer_name}}
- Telefone: {{whatsapp_number}}
- Cidade: {{customer_city}}
- Estado: {{customer_state}}

{{#if relevantKnowledge}}
## Conhecimento relevante:
{{relevantKnowledge}}
{{/if}}

## Instruções:
1. Sempre cumprimente o cliente pelo nome quando disponível
2. Seja prestativo e objetivo
3. Faça perguntas específicas para entender a necessidade
4. Ofereça soluções personalizadas
5. Mantenha um tom profissional mas amigável

Responda de forma natural e contextualizada à mensagem do cliente.`,
          llm_model: 'claude-3-5-sonnet-20241022',
          agent_type: 'general',
          is_active: true
        };

        const { data: created, error: createError } = await supabase
          .from('agent_prompts')
          .insert(defaultGeneralAgent)
          .select()
          .single();

        if (createError) throw createError;
        return created;
      }

      if (error) throw error;
      return data;
    }
  });
}


// Hook to get prompt variables
export function usePromptVariables() {
  return useQuery({
    queryKey: ['prompt-variables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_variables')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data;
    }
  });
}

// Hook to create/update agent prompt
export function useUpdateAgentPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      console.log('🔄 Saving agent prompt:', data);
      
      const { data: result, error } = await supabase
        .from('agent_prompts')
        .upsert({
          ...data,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('❌ Error saving prompt:', error);
        throw error;
      }

      console.log('✅ Prompt saved successfully:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('🔄 Invalidating queries...');
      // Invalidate both specific and general queries
      queryClient.invalidateQueries({ queryKey: ['agent-prompt', variables.category] });
      queryClient.invalidateQueries({ queryKey: ['agent-prompts'] });
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
    }
  });
}


// Hook to test prompt
export function useTestPrompt() {
  return useMutation({
    mutationFn: async ({
      agentPromptId,
      message,
      context
    }: {
      agentPromptId: string;
      message: string;
      context: any;
    }) => {
      const { dynamicAgentService } = await import('@/services/bot/dynamic-agent.service');
      return await dynamicAgentService.testPrompt(agentPromptId, message, context);
    }
  });
}