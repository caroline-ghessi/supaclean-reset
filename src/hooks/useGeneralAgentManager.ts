import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeneralAgentConfig {
  id?: string;
  name: string;
  description: string;
  knowledge_base: string;
  llm_model: string;
  is_active: boolean;
  category: string;
}

const DEFAULT_GENERAL_AGENT: Omit<GeneralAgentConfig, 'id'> = {
  category: 'geral',
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
  is_active: true
};

export function useGeneralAgentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State para controle de edição
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<GeneralAgentConfig | null>(null);

  // Query para buscar o agente geral
  const { data: generalAgent, isLoading, error } = useQuery({
    queryKey: ['general-agent'],
    queryFn: async () => {
      console.log('🔍 Buscando agente geral...');
      
      // Tentar buscar agente existente
      const { data, error } = await supabase
        .from('agent_prompts')
        .select('*')
        .eq('category', 'geral' as any)
        .eq('is_active', true)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('📝 Criando agente geral padrão...');
        
        // Criar agente padrão se não existir
        const { data: created, error: createError } = await supabase
          .from('agent_prompts')
          .insert(DEFAULT_GENERAL_AGENT as any)
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar agente geral:', createError);
          throw createError;
        }

        console.log('✅ Agente geral criado:', created);
        return created;
      }

      if (error) {
        console.error('❌ Erro ao buscar agente geral:', error);
        throw error;
      }

      console.log('✅ Agente geral encontrado:', data);
      return data;
    }
  });

  // Mutation para atualizar o agente
  const updateMutation = useMutation({
    mutationFn: async (config: GeneralAgentConfig) => {
      console.log('💾 Salvando configurações do agente geral:', config);
      
      const { data, error } = await supabase
        .from('agent_prompts')
        .update({
          name: config.name,
          description: config.description,
          knowledge_base: config.knowledge_base,
          llm_model: config.llm_model,
          is_active: config.is_active,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', config.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar agente geral:', error);
        throw error;
      }

      console.log('✅ Agente geral atualizado:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general-agent'] });
      toast({
        title: "Agente atualizado",
        description: "Configurações do agente geral foram salvas com sucesso.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('❌ Erro na mutation:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Sincronizar estado local com dados do servidor
  useEffect(() => {
    if (generalAgent && !isEditing) {
      setLocalConfig(generalAgent);
    }
  }, [generalAgent, isEditing]);

  // Funções de controle
  const startEditing = () => {
    if (generalAgent) {
      setLocalConfig({ ...generalAgent });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    if (generalAgent) {
      setLocalConfig({ ...generalAgent });
      setIsEditing(false);
    }
  };

  const saveChanges = () => {
    if (localConfig && localConfig.id) {
      updateMutation.mutate(localConfig);
    }
  };

  const updateLocalConfig = (updates: Partial<GeneralAgentConfig>) => {
    if (localConfig) {
      setLocalConfig({ ...localConfig, ...updates });
    }
  };

  return {
    // Data
    generalAgent,
    localConfig,
    isLoading,
    error,
    
    // State
    isEditing,
    isSaving: updateMutation.isPending,
    
    // Actions
    startEditing,
    cancelEditing,
    saveChanges,
    updateLocalConfig
  };
}