import React, { useState, useEffect } from 'react';
import { Save, Edit3, Upload, FileText, Brain, Database, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAgentConfig, useUpdateAgentConfig } from '@/hooks/useAgentConfigs';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';
import { useToast } from '@/hooks/use-toast';

interface AgentConfigEditorProps {
  agentId: string;
}

export function AgentConfigEditor({ agentId }: AgentConfigEditorProps) {
  const { data: agent, isLoading } = useAgentConfig(agentId);
  const updateAgent = useUpdateAgentConfig();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState({
    agent_name: '',
    description: '',
    system_prompt: '',
    llm_model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    max_tokens: 500,
    is_active: true
  });

  // Atualizar estado local quando o agente carregue
  useEffect(() => {
    if (agent) {
      setLocalConfig({
        agent_name: agent.agent_name || '',
        description: agent.description || '',
        system_prompt: agent.system_prompt || '',
        llm_model: agent.llm_model || 'claude-3-5-sonnet-20241022',
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 500,
        is_active: agent.is_active ?? true
      });
    }
  }, [agent]);

  const handleSave = async () => {
    try {
      await updateAgent.mutateAsync({
        id: agentId,
        ...localConfig
      });
      
      setIsEditing(false);
      toast({
        title: "Agente atualizado",
        description: "As configurações do agente foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do agente.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    if (agent) {
      setLocalConfig({
        agent_name: agent.agent_name || '',
        description: agent.description || '',
        system_prompt: agent.system_prompt || '',
        llm_model: agent.llm_model || 'claude-3-5-sonnet-20241022',
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 500,
        is_active: agent.is_active ?? true
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!agent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Agente não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {agent.agent_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {agent.description}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateAgent.isPending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateAgent.isPending}
              >
                {updateAgent.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Prompt
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Base de Conhecimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Configurações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agent-name">Nome do Agente</Label>
                  <Input
                    id="agent-name"
                    value={localConfig.agent_name}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, agent_name: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-description">Descrição</Label>
                  <Input
                    id="agent-description"
                    value={localConfig.description}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Modelo LLM */}
              <div>
                <Label>Modelo LLM</Label>
                {isEditing ? (
                  <Select 
                    value={localConfig.llm_model} 
                    onValueChange={(value) => setLocalConfig(prev => ({ ...prev, llm_model: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet-4-20250514">
                        Claude Sonnet 4 (Mais Inteligente)
                      </SelectItem>
                      <SelectItem value="claude-opus-4-20250514">
                        Claude Opus 4 (Máxima Capacidade)
                      </SelectItem>
                      <SelectItem value="claude-3-5-sonnet-20241022">
                        Claude 3.5 Sonnet (Padrão)
                      </SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022">
                        Claude 3.5 Haiku (Rápido)
                      </SelectItem>
                      <SelectItem value="gpt-5-2025-08-07">
                        GPT-5 (Flagship OpenAI)
                      </SelectItem>
                      <SelectItem value="gpt-5-mini-2025-08-07">
                        GPT-5 Mini (Eficiente)
                      </SelectItem>
                      <SelectItem value="gpt-4o">
                        GPT-4o (OpenAI)
                      </SelectItem>
                      <SelectItem value="gpt-4o-mini">
                        GPT-4o Mini (Econômico)
                      </SelectItem>
                      <SelectItem value="grok-beta">
                        Grok Beta (xAI)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-sm">
                      {localConfig.llm_model === 'claude-sonnet-4-20250514' ? 'Claude Sonnet 4' :
                       localConfig.llm_model === 'claude-opus-4-20250514' ? 'Claude Opus 4' :
                       localConfig.llm_model === 'claude-3-5-sonnet-20241022' ? 'Claude 3.5 Sonnet' :
                       localConfig.llm_model === 'claude-3-5-haiku-20241022' ? 'Claude 3.5 Haiku' :
                       localConfig.llm_model === 'gpt-5-2025-08-07' ? 'GPT-5' :
                       localConfig.llm_model === 'gpt-5-mini-2025-08-07' ? 'GPT-5 Mini' :
                       localConfig.llm_model === 'gpt-4o' ? 'GPT-4o' :
                       localConfig.llm_model === 'gpt-4o-mini' ? 'GPT-4o Mini' :
                       localConfig.llm_model === 'grok-beta' ? 'Grok Beta' :
                       localConfig.llm_model}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Parâmetros do modelo */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>
                    Temperatura: {localConfig.temperature}
                    <span className="text-xs text-muted-foreground ml-2">
                      (Criatividade)
                    </span>
                  </Label>
                  <Slider
                    value={[localConfig.temperature]}
                    onValueChange={(value) => setLocalConfig(prev => ({ ...prev, temperature: value[0] }))}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={!isEditing}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Preciso</span>
                    <span>Criativo</span>
                  </div>
                </div>
                
                <div>
                  <Label>
                    Max Tokens: {localConfig.max_tokens}
                    <span className="text-xs text-muted-foreground ml-2">
                      (Tamanho da resposta)
                    </span>
                  </Label>
                  <Slider
                    value={[localConfig.max_tokens]}
                    onValueChange={(value) => setLocalConfig(prev => ({ ...prev, max_tokens: value[0] }))}
                    min={100}
                    max={2000}
                    step={50}
                    disabled={!isEditing}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Curto</span>
                    <span>Longo</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Status do Agente</Label>
                  <p className="text-xs text-muted-foreground">
                    Controle se este agente está ativo no sistema
                  </p>
                </div>
                <Switch
                  checked={localConfig.is_active}
                  onCheckedChange={(checked) => setLocalConfig(prev => ({ ...prev, is_active: checked }))}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Prompt do Sistema
              </CardTitle>
              <CardDescription>
                Configure o prompt que define o comportamento do agente especialista.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="system-prompt">Prompt Principal</Label>
                <Textarea
                  id="system-prompt"
                  value={localConfig.system_prompt}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, system_prompt: e.target.value }))}
                  disabled={!isEditing}
                  rows={20}
                  className="mt-2 font-mono text-sm"
                  placeholder="Configure o prompt do agente especialista aqui..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {isEditing 
                    ? 'Defina o comportamento, conhecimento e personalidade do agente especialista.'
                    : 'Clique em "Editar" para modificar este prompt.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <KnowledgeBaseManager 
            agentCategory={agent.product_category || 'drywall_divisorias'} 
          />
        </TabsContent>
      </Tabs>

      {/* Status e estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status e Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <div className="mt-1">
                <Badge variant="outline">
                  {agent.agent_type === 'specialist' ? 'Especialista' : agent.agent_type}
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <div className="mt-1">
                <Badge variant="outline">
                  {agent.product_category}
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                  {agent.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <Label className="text-xs text-muted-foreground">Última atualização</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(agent.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}