import React from 'react';
import { FileText, Edit3, Brain, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeadSummaryAgentManager } from '@/hooks/useLeadSummaryAgent';

export function LeadSummaryAgentSection() {
  const {
    agent,
    localConfig,
    isLoading,
    isEditing,
    isSaving,
    startEditing,
    cancelEditing,
    saveChanges,
    updateLocalConfig
  } = useLeadSummaryAgentManager();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="w-32 h-5 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full h-20 bg-muted rounded animate-pulse" />
            <div className="w-full h-40 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Agente de Resumos de Leads
              </CardTitle>
              <CardDescription>
                Configure o agente responsável por gerar resumos de conversas para envio aos vendedores
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={localConfig.is_active ? 'default' : 'secondary'}>
              {localConfig.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={startEditing}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="agent-name">Nome do Agente</Label>
            <Input
              id="agent-name"
              value={localConfig.agent_name || ''}
              onChange={(e) => updateLocalConfig({ agent_name: e.target.value })}
              disabled={!isEditing}
              className="mt-2"
              placeholder="Nome do agente de resumos"
            />
          </div>
          
          <div>
            <Label htmlFor="agent-description">Descrição</Label>
            <Input
              id="agent-description"
              value={localConfig.description || ''}
              onChange={(e) => updateLocalConfig({ description: e.target.value })}
              disabled={!isEditing}
              className="mt-2"
              placeholder="Descrição do agente"
            />
          </div>
        </div>

        {/* Configurações de modelo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Modelo LLM</Label>
            {isEditing ? (
              <Select 
                value={localConfig.llm_model} 
                onValueChange={(value) => updateLocalConfig({ llm_model: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-5-sonnet-20241022">
                    Claude 3.5 Sonnet (Recomendado)
                  </SelectItem>
                  <SelectItem value="claude-3-5-haiku-20241022">
                    Claude 3.5 Haiku (Rápido)
                  </SelectItem>
                  <SelectItem value="gpt-5-2025-08-07">
                    GPT-5 (OpenAI)
                  </SelectItem>
                  <SelectItem value="gpt-4.1-2025-04-14">
                    GPT-4.1 (OpenAI)
                  </SelectItem>
                  <SelectItem value="gpt-4o">
                    GPT-4o (OpenAI)
                  </SelectItem>
                  <SelectItem value="gpt-4o-mini">
                    GPT-4o Mini (Econômico)
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-2">
                <Badge variant="outline" className="text-sm">
                  {localConfig.llm_model === 'claude-3-5-sonnet-20241022' ? 'Claude 3.5 Sonnet' :
                   localConfig.llm_model === 'claude-3-5-haiku-20241022' ? 'Claude 3.5 Haiku' :
                   localConfig.llm_model === 'gpt-5-2025-08-07' ? 'GPT-5' :
                   localConfig.llm_model === 'gpt-4.1-2025-04-14' ? 'GPT-4.1' :
                   localConfig.llm_model === 'gpt-4o' ? 'GPT-4o' :
                   localConfig.llm_model === 'gpt-4o-mini' ? 'GPT-4o Mini' :
                   localConfig.llm_model || 'Claude 3.5 Sonnet'}
                </Badge>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={localConfig.temperature || 0.3}
              onChange={(e) => updateLocalConfig({ temperature: parseFloat(e.target.value) })}
              disabled={!isEditing}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              0.0 = Determinístico, 1.0 = Criativo
            </p>
          </div>

          <div>
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              min="100"
              max="2000"
              step="50"
              value={localConfig.max_tokens || 500}
              onChange={(e) => updateLocalConfig({ max_tokens: parseInt(e.target.value) })}
              disabled={!isEditing}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Limite de tokens na resposta
            </p>
          </div>
        </div>

        {/* Prompt do sistema */}
        <div>
          <Label htmlFor="system-prompt">Prompt do Sistema</Label>
          <Textarea
            id="system-prompt"
            value={localConfig.system_prompt || ''}
            onChange={(e) => updateLocalConfig({ system_prompt: e.target.value })}
            disabled={!isEditing}
            rows={20}
            className="mt-2 font-mono text-sm"
            placeholder="Configure o prompt do agente de resumos aqui..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            {isEditing 
              ? 'Este prompt define como o agente deve gerar resumos das conversas para envio aos vendedores.'
              : 'Clique em "Editar" para modificar este prompt e as configurações do modelo.'
            }
          </p>
        </div>

        {/* Status e informações */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="mt-1">
              <Badge variant={localConfig.is_active ? 'default' : 'secondary'}>
                {localConfig.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <div className="mt-1">
              <Badge variant="outline">Gerador de Resumos</Badge>
            </div>
          </div>
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">Última Atualização</Label>
            <div className="mt-1 text-xs text-muted-foreground">
              {agent?.updated_at 
                ? new Date(agent.updated_at).toLocaleDateString('pt-BR')
                : 'Nunca configurado'
              }
            </div>
          </div>
        </div>

        {/* Exemplo de uso */}
        {!isEditing && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Como funciona
            </h4>
            <p className="text-xs text-muted-foreground">
              Este agente analisa conversas completas entre clientes e atendimento, extraindo informações importantes 
              como necessidades, orçamento, prazo e próximos passos, gerando um resumo estruturado para facilitar 
              o trabalho dos vendedores.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}