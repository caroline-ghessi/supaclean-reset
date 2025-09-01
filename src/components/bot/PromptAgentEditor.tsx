import React, { useState, useEffect } from 'react';
import { 
  Bot, Save, Copy, Database, Zap,
  FileText, MessageSquare, Brain, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgentPrompt, useUpdateAgentPrompt } from '@/hooks/useAgentPrompts';
import { ProductCategory } from '@/types/conversation.types';
import { toast } from '@/hooks/use-toast';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';

interface PromptAgentEditorProps {
  selectedAgent: string;
  category: ProductCategory;
}

const LLM_OPTIONS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'grok-beta', label: 'Grok Beta', provider: 'xAI' }
];

export function PromptAgentEditor({ selectedAgent, category }: PromptAgentEditorProps) {
  const [activeTab, setActiveTab] = useState<'system' | 'settings' | 'knowledge'>('system');
  
  // Buscar dados do agente usando a categoria
  const { data: agentPrompt, isLoading } = useAgentPrompt(category);
  const updateAgentPrompt = useUpdateAgentPrompt();

  const [localPrompt, setLocalPrompt] = useState('');
  const [localLlmModel, setLocalLlmModel] = useState('claude-3-5-sonnet-20241022');
  const [localName, setLocalName] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar estados locais quando os dados carregarem
  useEffect(() => {
    if (agentPrompt) {
      setLocalPrompt(agentPrompt.knowledge_base || '');
      setLocalLlmModel(agentPrompt.llm_model || 'claude-3-5-sonnet-20241022');
      setLocalName(agentPrompt.name || '');
      setLocalDescription(agentPrompt.description || '');
    }
  }, [agentPrompt]);

  const handleSave = async () => {
    if (!agentPrompt) {
      toast({
        title: "Erro",
        description: "Nenhum agente selecionado para salvar.",
        variant: "destructive"
      });
      return;
    }

    console.log('🚀 Save button clicked for agent:', selectedAgent);
    
    setIsSaving(true);
    try {
      const dataToSave = {
        id: agentPrompt.id,
        category: agentPrompt.category,
        name: localName,
        description: localDescription,
        knowledge_base: localPrompt,
        llm_model: localLlmModel,
        agent_type: agentPrompt.agent_type,
        is_active: agentPrompt.is_active,
        version: agentPrompt.version
      };

      console.log('📝 Data being saved:', dataToSave);

      await updateAgentPrompt.mutateAsync(dataToSave);
      
      toast({
        title: "Sucesso!",
        description: "Agente salvo com sucesso!",
      });
      
      console.log('✅ Save completed successfully');
    } catch (error) {
      console.error('❌ Error saving agent:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o agente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(localPrompt);
    toast({
      title: "Copiado!",
      description: "Prompt copiado para a área de transferência.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando configuração do agente...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agentPrompt) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Agente não encontrado
          </h3>
          <p className="text-muted-foreground max-w-md">
            Não foi possível carregar as configurações deste agente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              {agentPrompt.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {agentPrompt.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {agentPrompt.llm_model === 'claude-3-5-sonnet-20241022' ? 'Claude 3.5 Sonnet' :
               agentPrompt.llm_model === 'claude-3-5-haiku-20241022' ? 'Claude 3.5 Haiku' :
               agentPrompt.llm_model === 'gpt-4o' ? 'GPT-4o' :
               agentPrompt.llm_model === 'gpt-4o-mini' ? 'GPT-4o Mini' :
               agentPrompt.llm_model || 'Claude 3.5 Sonnet'}
            </Badge>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Prompt Principal
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Base de Conhecimento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agent-prompt">Base de Conhecimento</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <Textarea
                id="agent-prompt"
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="Digite o prompt do agente aqui..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use variáveis como customer_name, whatsapp_number, etc. para personalizar as respostas.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Nome do Agente</Label>
                  <Input
                    id="agent-name"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder="Nome do agente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-description">Descrição</Label>
                  <Textarea
                    id="agent-description"
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    placeholder="Descrição do agente"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-model">Modelo LLM</Label>
                  <Select value={localLlmModel} onValueChange={setLocalLlmModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo LLM" />
                    </SelectTrigger>
                    <SelectContent>
                      {LLM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {option.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground capitalize">
                      {category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeBaseManager agentCategory={category} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}