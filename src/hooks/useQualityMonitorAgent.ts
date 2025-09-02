import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export interface QualityMonitorAgentConfig {
  id?: string;
  agent_name: string;
  system_prompt: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Hook para buscar o agente de qualidade
export const useQualityMonitorAgent = () => {
  return useQuery({
    queryKey: ['quality-monitor-agent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('agent_type', 'quality_monitor')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching quality monitor agent:', error);
        throw error;
      }

      return data as QualityMonitorAgentConfig | null;
    },
  });
};

// Hook para criar/atualizar o agente de qualidade
export const useUpdateQualityMonitorAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<QualityMonitorAgentConfig>) => {
      // Verificar se já existe um agente
      const { data: existingAgent } = await supabase
        .from('agent_configs')
        .select('id')
        .eq('agent_type', 'quality_monitor')
        .single();

      if (existingAgent) {
        // Atualizar agente existente
        const { data, error } = await supabase
          .from('agent_configs')
          .update({
            ...config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAgent.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo agente
        const { data, error } = await supabase
          .from('agent_configs')
          .insert({
            agent_type: 'quality_monitor',
            agent_name: config.agent_name || 'Monitor de Qualidade',
            system_prompt: config.system_prompt || getDefaultPrompt(),
            llm_model: config.llm_model || 'claude-3-5-sonnet-20241022',
            temperature: config.temperature ?? 0.3,
            max_tokens: config.max_tokens ?? 1000,
            is_active: config.is_active ?? true,
            description: config.description || 'Agente responsável por monitorar a qualidade do atendimento dos vendedores',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-monitor-agent'] });
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      toast.success('Agente de qualidade atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating quality monitor agent:', error);
      toast.error('Erro ao atualizar agente de qualidade');
    },
  });
};

// Hook para gerenciar o estado local do agente
export const useQualityMonitorAgentManager = () => {
  const { data: agent, isLoading } = useQualityMonitorAgent();
  const updateAgent = useUpdateQualityMonitorAgent();

  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<QualityMonitorAgentConfig>({
    agent_name: 'Monitor de Qualidade',
    system_prompt: getDefaultPrompt(),
    llm_model: 'claude-3-5-sonnet-20241022',
    temperature: 0.3,
    max_tokens: 1000,
    is_active: true,
    description: 'Agente responsável por monitorar a qualidade do atendimento dos vendedores',
  });

  // Sincronizar estado local com dados do servidor
  useEffect(() => {
    if (agent) {
      setLocalConfig({
        id: agent.id,
        agent_name: agent.agent_name,
        system_prompt: agent.system_prompt,
        llm_model: agent.llm_model || 'claude-3-5-sonnet-20241022',
        temperature: agent.temperature ?? 0.3,
        max_tokens: agent.max_tokens ?? 1000,
        is_active: agent.is_active,
        description: agent.description || '',
      });
    }
  }, [agent]);

  const startEditing = () => setIsEditing(true);

  const cancelEditing = () => {
    if (agent) {
      setLocalConfig({
        id: agent.id,
        agent_name: agent.agent_name,
        system_prompt: agent.system_prompt,
        llm_model: agent.llm_model || 'claude-3-5-sonnet-20241022',
        temperature: agent.temperature ?? 0.3,
        max_tokens: agent.max_tokens ?? 1000,
        is_active: agent.is_active,
        description: agent.description || '',
      });
    }
    setIsEditing(false);
  };

  const saveChanges = async () => {
    try {
      await updateAgent.mutateAsync(localConfig);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const updateLocalConfig = (updates: Partial<QualityMonitorAgentConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  return {
    agent,
    localConfig,
    isLoading,
    isEditing,
    isSaving: updateAgent.isPending,
    startEditing,
    cancelEditing,
    saveChanges,
    updateLocalConfig,
  };
};

// Prompt padrão para o agente de qualidade
function getDefaultPrompt(): string {
  return `Você é um Agente de Monitoramento de Qualidade especializado em analisar conversas de vendedores via WhatsApp.

## OBJETIVO
Analise a qualidade do atendimento prestado pelos vendedores, identificando pontos fortes, áreas de melhoria e gerando alertas quando necessário.

## CRITÉRIOS DE AVALIAÇÃO

### 1. TEMPO DE RESPOSTA (0-10)
- 10: Resposta imediata (< 5 min)
- 8-9: Resposta rápida (5-15 min)
- 6-7: Resposta aceitável (15-30 min)
- 4-5: Resposta lenta (30 min - 2h)
- 0-3: Resposta muito lenta (> 2h)

### 2. PROFISSIONALISMO (0-10)
- Linguagem adequada e cordial
- Uso correto de português
- Ausência de gírias ou linguagem inadequada
- Tom respeitoso e empático

### 3. CLAREZA NA COMUNICAÇÃO (0-10)
- Mensagens claras e objetivas
- Informações completas
- Ausência de ambiguidades
- Organização lógica das informações

### 4. PROATIVIDADE (0-10)
- Antecipação às necessidades do cliente
- Oferecimento de soluções
- Proposição de próximos passos
- Engajamento ativo na conversa

### 5. CAPACIDADE DE RESOLUÇÃO (0-10)
- Eficiência na resolução de dúvidas
- Conhecimento do produto/serviço
- Encaminhamento adequado quando necessário
- Soluções práticas oferecidas

### 6. FOLLOW-UP (0-10)
- Acompanhamento adequado dos leads
- Cobrança de retornos quando apropriado
- Manutenção do relacionamento
- Persistência equilibrada

## FORMATO DE RESPOSTA
Retorne sempre um JSON com:
{
  "overall_score": 8.5,
  "criteria_scores": {
    "response_time": 9,
    "professionalism": 8,
    "clarity": 9,
    "proactivity": 8,
    "resolution": 8,
    "followup": 7
  },
  "issues_identified": [
    "Demora excessiva para enviar proposta",
    "Não confirmou entendimento do cliente"
  ],
  "recommendations": [
    "Enviar proposta em até 24h",
    "Confirmar entendimento antes de prosseguir",
    "Fazer follow-up em 2 dias se não houver resposta"
  ],
  "alerts": [
    {
      "type": "response_time",
      "severity": "medium",
      "message": "Tempo de resposta acima do esperado"
    }
  ],
  "positive_aspects": [
    "Linguagem profissional",
    "Informações claras sobre o produto"
  ]
}

## ALERTAS AUTOMÁTICOS
Gere alertas para:
- Score geral < 6.0 (severity: high)
- Tempo resposta < 5.0 (severity: medium)
- Profissionalismo < 7.0 (severity: high)
- Linguagem inadequada detectada (severity: critical)

Analise sempre o contexto completo da conversa e seja justo na avaliação.`;
}

export { getDefaultPrompt };