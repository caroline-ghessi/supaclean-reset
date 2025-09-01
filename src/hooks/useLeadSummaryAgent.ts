import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LeadSummaryAgentConfig {
  id: string;
  agent_name: string;
  description?: string;
  system_prompt: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Hook para buscar configuração do agente de resumos
export function useLeadSummaryAgent() {
  return useQuery({
    queryKey: ['lead-summary-agent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('agent_type', 'summarizer')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        throw error;
      }

      return data ? {
        id: data.id,
        agent_name: data.agent_name,
        description: data.description,
        system_prompt: data.system_prompt,
        llm_model: 'claude-3-5-sonnet-20241022', // Valor padrão
        temperature: data.temperature,
        max_tokens: data.max_tokens,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      } as LeadSummaryAgentConfig : null;
    }
  });
}

// Hook para atualizar configuração do agente de resumos
export function useUpdateLeadSummaryAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<LeadSummaryAgentConfig> & { id?: string }) => {
      const agentData = {
        agent_name: config.agent_name || 'Gerador de Resumos',
        agent_type: 'summarizer' as const,
        description: config.description || 'Agente responsável por gerar resumos de conversas para envio aos vendedores',
        system_prompt: config.system_prompt || '',
        temperature: config.temperature || 0.3,
        max_tokens: config.max_tokens || 500,
        is_active: config.is_active !== undefined ? config.is_active : true,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (config.id) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('agent_configs')
          .update(agentData)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('agent_configs')
          .insert({
            ...agentData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-summary-agent'] });
      toast({
        title: "Configuração salva",
        description: "As configurações do agente de resumos foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar agente de resumos:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do agente de resumos.",
        variant: "destructive",
      });
    }
  });
}

// Hook para gerenciar estado local e edição
export function useLeadSummaryAgentManager() {
  const { data: agent, isLoading } = useLeadSummaryAgent();
  const updateMutation = useUpdateLeadSummaryAgent();
  
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<Partial<LeadSummaryAgentConfig>>({});

  // Inicializar config local quando dados chegarem
  useEffect(() => {
    if (agent) {
      setLocalConfig({
        id: agent.id,
        agent_name: agent.agent_name,
        description: agent.description,
        system_prompt: agent.system_prompt,
        llm_model: agent.llm_model || 'claude-3-5-sonnet-20241022',
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        is_active: agent.is_active
      });
    } else {
      // Configuração padrão se não existir agente
      setLocalConfig({
        agent_name: 'Gerador de Resumos',
        description: 'Agente responsável por gerar resumos de conversas para envio aos vendedores',
        system_prompt: getDefaultPrompt(),
        llm_model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        max_tokens: 500,
        is_active: true
      });
    }
  }, [agent]);

  const startEditing = () => setIsEditing(true);
  
  const cancelEditing = () => {
    setIsEditing(false);
    if (agent) {
      setLocalConfig({
        id: agent.id,
        agent_name: agent.agent_name,
        description: agent.description,
        system_prompt: agent.system_prompt,
        llm_model: agent.llm_model,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        is_active: agent.is_active
      });
    }
  };

  const saveChanges = async () => {
    try {
      await updateMutation.mutateAsync(localConfig);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const updateLocalConfig = (updates: Partial<LeadSummaryAgentConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  return {
    agent,
    localConfig,
    isLoading,
    isEditing,
    isSaving: updateMutation.isPending,
    startEditing,
    cancelEditing,
    saveChanges,
    updateLocalConfig
  };
}

function getDefaultPrompt(): string {
  return `Você é um agente especializado em gerar resumos concisos e informativos de conversas de atendimento para serem enviados aos vendedores.

## Sua função:
Analisar a conversa completa entre o cliente e o atendimento e gerar um resumo estruturado que permita ao vendedor entender rapidamente:
- O que o cliente está buscando
- Qual a necessidade específica
- Informações importantes coletadas
- Próximos passos sugeridos

## Formato do resumo:
**Cliente:** [Nome do cliente]
**Interesse:** [Produto/serviço de interesse]
**Necessidade:** [Descrição clara da necessidade]
**Detalhes importantes:**
- [Informação relevante 1]
- [Informação relevante 2]
- [Informação relevante 3]

**Próximos passos:** [Ação recomendada para o vendedor]

## Diretrizes:
- Seja objetivo e direto
- Foque no que é mais importante para o vendedor
- Destaque informações como orçamento, prazo, localização
- Mantenha tom profissional
- Máximo de 300 palavras

## Exemplo:
**Cliente:** João Silva
**Interesse:** Energia Solar Residencial
**Necessidade:** Instalação para reduzir conta de luz de R$ 800/mês
**Detalhes importantes:**
- Casa de 200m² em Porto Alegre
- Conta de luz média R$ 800/mês
- Orçamento de até R$ 50.000
- Quer instalar em 60 dias
- Já pesquisou outras empresas

**Próximos passos:** Agendar visita técnica e apresentar proposta comercial`;
}