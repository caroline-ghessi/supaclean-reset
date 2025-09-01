import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ProductCategory } from '@/types/conversation.types';

export interface AgentConfig {
  id: string;
  agent_name: string;
  agent_type: 'general' | 'classifier' | 'extractor' | 'specialist' | 'lead_scorer';
  product_category?: ProductCategory;
  is_active: boolean;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  is_spy: boolean;
  description?: string;
  llm_model?: string;
  created_at: string;
  updated_at: string;
}

export function useAgentConfigs() {
  return useQuery({
    queryKey: ['agent-configs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('agent_configs')
        .select('*')
        .order('agent_type', { ascending: true })
        .order('agent_name', { ascending: true });

      if (error) throw error;
      return data as AgentConfig[];
    },
  });
}

export function useAgentConfig(id: string) {
  return useQuery({
    queryKey: ['agent-config', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('agent_configs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as AgentConfig;
    },
    enabled: !!id,
  });
}

export function useCreateAgentConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentData: Omit<AgentConfig, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('agent_configs')
        .insert(agentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
    },
  });
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...agentData }: Partial<AgentConfig> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('agent_configs')
        .update(agentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      queryClient.invalidateQueries({ queryKey: ['agent-config', data.id] });
    },
  });
}

export function useDeleteAgentConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('agent_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
    },
  });
}

export function useAgentsByType(agentType: 'general' | 'classifier' | 'extractor' | 'specialist' | 'lead_scorer') {
  return useQuery({
    queryKey: ['agent-configs', 'by-type', agentType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('agent_configs')
        .select('*')
        .eq('agent_type', agentType)
        .eq('is_active', true)
        .order('agent_name', { ascending: true });

      if (error) throw error;
      return data as AgentConfig[];
    },
  });
}

export function useSpecialistAgents() {
  return useQuery({
    queryKey: ['specialist-agents'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('agent_configs')
        .select('*')
        .eq('agent_type', 'specialist')
        .eq('is_active', true)
        .order('product_category', { ascending: true });

      if (error) throw error;
      return data as AgentConfig[];
    },
  });
}