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
        .eq('category', category)
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