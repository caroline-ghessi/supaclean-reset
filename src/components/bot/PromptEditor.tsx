import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Settings, Plus } from 'lucide-react';
import { ProductCategory } from '@/types/conversation.types';
import { useAgentPrompt, useUpdateAgentPrompt } from '@/hooks/useAgentPrompts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PromptEditorProps {
  selectedAgent: ProductCategory;
  selectedLLM: 'grok' | 'claude' | 'chatgpt';
  agentName: string;
}

export function PromptEditor({ selectedAgent, selectedLLM, agentName }: PromptEditorProps) {
  const { data: agentPrompt, isLoading } = useAgentPrompt(selectedAgent);
  const updateAgentPrompt = useUpdateAgentPrompt();
  const [isSaving, setIsSaving] = useState(false);
  const [localPrompt, setLocalPrompt] = useState('');

  // Update local state when data loads
  React.useEffect(() => {
    if (agentPrompt) {
      setLocalPrompt(agentPrompt.knowledge_base || '');
    }
  }, [agentPrompt]);

  const handleSave = async () => {
    if (!agentPrompt) return;

    setIsSaving(true);
    try {
      await updateAgentPrompt.mutateAsync({
        id: agentPrompt.id,
        knowledge_base: localPrompt,
        llm_model: agentPrompt.llm_model,
        category: agentPrompt.category,
        name: agentPrompt.name,
        description: agentPrompt.description,
        agent_type: agentPrompt.agent_type,
      });
      
      toast.success('Prompt salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar o prompt');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{agentName}</h2>
            <p className="text-muted-foreground">
              Configure o prompt principal do agente (sistema simplificado)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{selectedLLM.toUpperCase()}</Badge>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        {/* Agent Info */}
        {agentPrompt && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Nome</p>
                  <p className="text-sm text-muted-foreground">{agentPrompt.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Versão</p>
                  <p className="text-sm text-muted-foreground">v{agentPrompt.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Atualizado</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(agentPrompt.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!agentPrompt ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Agente não configurado</h3>
              <p className="text-muted-foreground mb-4">
                Este agente ainda não possui prompts configurados. 
                Crie o primeiro prompt para começar.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Prompt
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Prompt Principal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Este é o prompt único que define todo o comportamento do agente. 
                Não há mais steps - tudo acontece em uma única interação.
              </p>
              
              <Textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder={`Exemplo para agente de ${selectedAgent}:

Você é um assistente especializado em ${selectedAgent}.

**Suas responsabilidades:**
- Responder perguntas sobre produtos de ${selectedAgent}
- Qualificar leads coletando informações importantes  
- Fornecer orçamentos quando possível
- Transferir para humano quando necessário

**Informações sobre ${selectedAgent}:**
[Adicione aqui informações específicas do produto/serviço]

**Como se comportar:**
- Sempre seja amigável e profissional
- Faça perguntas para entender melhor as necessidades
- Use as variáveis disponíveis como {{customer_name}}, {{energy_bill_value}}, etc.
- Quando tiver informações suficientes, ofereça um orçamento ou transferir para especialista

**Exemplo de conversa:**
Cliente: {{message}}
Contexto: Nome = {{customer_name}}, Lead Score = {{lead_score}}

Resposta: [sua resposta aqui baseada no contexto]`}
              />
              
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Use variáveis como: {'{{customer_name}}'}, {'{{energy_bill_value}}'}, {'{{lead_score}}'}, {'{{current_date}}'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}