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
import { useAgentConfig, useUpdateAgentConfig } from '@/hooks/useAgentConfigs';
import { ProductCategory } from '@/types/conversation.types';
import { toast } from '@/hooks/use-toast';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';

interface EnhancedPromptEditorProps {
  selectedAgent: string;
  agentType: 'specialist' | 'classifier' | 'extractor' | 'lead_scorer';
}

const LLM_OPTIONS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'grok-beta', label: 'Grok Beta', provider: 'xAI' }
];

export function EnhancedPromptEditor({ selectedAgent, agentType }: EnhancedPromptEditorProps) {
  const [activeTab, setActiveTab] = useState<'system' | 'knowledge' | 'settings' | 'test'>('system');
  
  // Buscar dados do agente usando o ID
  const { data: agentConfig, isLoading } = useAgentConfig(selectedAgent);
  const updateAgentConfig = useUpdateAgentConfig();

  const [localPrompt, setLocalPrompt] = useState('');
  const [localLlmModel, setLocalLlmModel] = useState('claude-3-5-sonnet-20241022');
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar estados locais quando os dados carregarem
  useEffect(() => {
    if (agentConfig) {
      setLocalPrompt(agentConfig.system_prompt || '');
      // Para agent_configs não temos llm_model, usar padrão
      setLocalLlmModel('claude-3-5-sonnet-20241022');
    }
  }, [agentConfig]);

  const handleSave = async () => {
    if (!agentConfig) {
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
        id: agentConfig.id,
        system_prompt: localPrompt,
        // Manter os outros campos do agente
        agent_name: agentConfig.agent_name,
        agent_type: agentConfig.agent_type,
        product_category: agentConfig.product_category,
        is_active: agentConfig.is_active,
        temperature: agentConfig.temperature,
        max_tokens: agentConfig.max_tokens,
        is_spy: agentConfig.is_spy,
        description: agentConfig.description
      };

      console.log('📝 Data being saved:', dataToSave);

      await updateAgentConfig.mutateAsync(dataToSave);
      
      toast({
        title: "Sucesso!",
        description: "Prompt salvo com sucesso!",
      });
      
      console.log('✅ Save completed successfully');
    } catch (error) {
      console.error('❌ Error saving prompt:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o prompt. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAgentIcon = () => {
    if (agentType === 'classifier') return Brain;
    if (agentType === 'extractor') return Search;
    if (agentType === 'lead_scorer') return Brain;
    return Bot;
  };

  const getAgentName = () => {
    if (agentConfig?.agent_name) return agentConfig.agent_name;
    if (agentType === 'classifier') return 'Agente Classificador';
    if (agentType === 'extractor') return 'Agente Extrator de Dados';
    if (agentType === 'lead_scorer') return 'Avaliador de Leads';
    return selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1).replace('_', ' ');
  };

  const IconComponent = getAgentIcon();
  const selectedLlm = LLM_OPTIONS.find(llm => llm.value === localLlmModel);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {getAgentName()}
                <Badge variant={agentType === 'specialist' ? 'default' : 'secondary'}>
                  {agentType === 'specialist' ? 'Especialista' : 
                   agentType === 'lead_scorer' ? 'Avaliador' : 'Espião'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                LLM: {selectedLlm?.label} ({selectedLlm?.provider})
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Prompt Principal
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Testar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <div>
              <Label htmlFor="system-prompt">Prompt Principal</Label>
              <p className="text-sm text-muted-foreground mb-2">
                {agentType === 'classifier' 
                  ? 'Instruções para classificar intenções dos clientes'
                  : agentType === 'extractor'
                  ? 'Instruções para extrair dados das conversas'
                  : agentType === 'lead_scorer'
                  ? 'Instruções para avaliar temperatura dos leads e calcular score'
                  : 'Instruções completas de como o agente deve se comportar, responder e interagir com os clientes'}
              </p>
              <Textarea
                id="system-prompt"
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder={
                  agentType === 'classifier'
                    ? 'Ex: Você é um classificador de intenções. Analise as mensagens e identifique a categoria do produto...'
                    : agentType === 'extractor'
                    ? 'Ex: Você é um extrator de dados. Analise as conversas e extraia informações relevantes...'
                    : agentType === 'lead_scorer'
                    ? 'Ex: Você é um avaliador de leads. Analise conversas e determine a temperatura (cold/warm/hot) e score (0-100) baseado em urgência, dados fornecidos, qualidade do engajamento e histórico de interação...'
                    : `Ex: Você é um assistente especializado em ${selectedAgent}. 

Suas responsabilidades:
- Responder perguntas sobre produtos
- Qualificar leads
- Coletar informações dos clientes
- Fornecer orçamentos

Informações sobre produtos:
[Adicione aqui as informações específicas do produto]

Sempre seja amigável, profissional e prestativo.`
                }
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Variáveis: {'{'}customer_name{'}'}, {'{'}energy_bill_value{'}'}, {'{'}lead_score{'}'}, {'{'}current_date{'}'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <KnowledgeBaseManager agentCategory={agentConfig?.product_category || 'geral' as ProductCategory} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="llm-select">Modelo de IA (LLM)</Label>
                <Badge variant="outline">{selectedLlm?.provider}</Badge>
              </div>
              <Select value={localLlmModel} onValueChange={setLocalLlmModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo de IA" />
                </SelectTrigger>
                <SelectContent>
                  {LLM_OPTIONS.map((llm) => (
                    <SelectItem key={llm.value} value={llm.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{llm.label}</span>
                        <Badge variant="outline" className="ml-2">{llm.provider}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label>Configurações do Agente</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm font-medium">Categoria</p>
                  <p className="text-sm text-muted-foreground">{agentConfig?.product_category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipo</p>
                  <p className="text-sm text-muted-foreground">
                    {agentConfig?.agent_type === 'specialist' ? 'Especialista' : 
                     agentConfig?.agent_type === 'classifier' ? 'Classificador' :
                     agentConfig?.agent_type === 'extractor' ? 'Extrator' :
                     agentConfig?.agent_type === 'lead_scorer' ? 'Avaliador de Leads' : 'Geral'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>


          <TabsContent value="test" className="space-y-6">
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Testador de prompts em desenvolvimento</p>
              <p className="text-sm">Em breve você poderá testar os prompts aqui</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}