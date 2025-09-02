import React, { useState } from 'react';
import { 
  Bot, Settings, TestTube, Save, Plus, Edit3, Trash2, 
  ChevronRight, Code, MessageSquare, Zap, Brain, 
  FileText, Copy, History, AlertCircle, CheckCircle,
  Sparkles, Rocket, Database, ArrowRight, Layers,
  Sun, Home, Hammer, Wrench, PaintBucket, Eye, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgentsByType } from '@/hooks/useAgentConfigs';
import { useGeneralAgentManager } from '@/hooks/useGeneralAgentManager';
import { SpyAgentCard } from './SpyAgentCard';
import { EnhancedPromptEditor } from './EnhancedPromptEditor';
import { PromptAgentEditor } from './PromptAgentEditor';
import { LeadSummaryAgentSection } from './LeadSummaryAgentSection';
import { AgentConfigEditor } from './AgentConfigEditor';
import { QualityMonitorAgentSection } from './QualityMonitorAgentSection';

// Função para mapear categorias para ícones
function getIconForCategory(category: string | null) {
  switch (category) {
    case 'energia_solar': return Sun;
    case 'telha_shingle': return Home;
    case 'steel_frame': return Layers;
    case 'drywall_divisorias': return Hammer;
    case 'ferramentas': return Wrench;
    case 'acabamentos': return PaintBucket;
    case 'pisos': return PaintBucket;
    case 'forros': return Layers;
    case 'lead_scorer': return Brain;
    default: return Bot;
  }
}

// Agente Card Component para especialistas
interface Agent {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  conversations?: number;
  status: 'active' | 'maintenance';
  description: string;
}

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  const IconComponent = agent.icon;

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
        ${isSelected 
          ? 'bg-primary/10 border-primary shadow-sm' 
          : 'bg-card border-border hover:border-primary/50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg
          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
        `}>
          <IconComponent className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm text-foreground truncate">
              {agent.name}
            </h4>
            <Badge 
              variant={agent.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {agent.status === 'active' ? 'Ativo' : 'Manutenção'}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {agent.description}
          </p>
          
          {agent.conversations && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {agent.conversations} conversas
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AgentsSectionProps {
  selectedAgent: string | null;
  setSelectedAgent: (id: string | null) => void;
}

export function AgentsSection({ selectedAgent, setSelectedAgent }: AgentsSectionProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'specialists' | 'spies' | 'leads' | 'summary' | 'quality'>('general');
  const [selectedAgentType, setSelectedAgentType] = useState<'general' | 'specialist' | 'classifier' | 'extractor' | 'lead_scorer'>('general');
  
  // Gerenciador do agente geral
  const {
    generalAgent,
    localConfig,
    isLoading: loadingGeneral,
    isEditing: isEditingGeneral,
    isSaving,
    startEditing,
    cancelEditing,
    saveChanges,
    updateLocalConfig
  } = useGeneralAgentManager();
  
  // Buscar agentes reais do banco de dados
  const { data: specialistAgents, isLoading: loadingSpecialists } = useAgentsByType('specialist');
  const { data: classifierAgents, isLoading: loadingClassifiers } = useAgentsByType('classifier');
  const { data: extractorAgents, isLoading: loadingExtractors } = useAgentsByType('extractor');
  const { data: leadScorerAgents, isLoading: loadingLeadScorers } = useAgentsByType('lead_scorer');
  
  // Mapear agentes especializados para o formato esperado
  const mappedSpecialistAgents = specialistAgents?.map(agent => ({
    id: agent.id,
    name: agent.agent_name,
    icon: getIconForCategory(agent.product_category),
    conversations: Math.floor(Math.random() * 50), // Temporário
    status: agent.is_active ? 'active' as const : 'maintenance' as const,
    description: agent.description || 'Agente especializado'
  })) || [];
  
  const mappedSpyAgents = [
    ...(classifierAgents?.map(agent => ({
      id: agent.id,
      name: agent.agent_name,
      icon: Brain,
      status: agent.is_active ? 'active' as const : 'maintenance' as const,
      description: agent.description || 'Classifica intenções dos clientes',
      type: 'classifier' as const
    })) || []),
    ...(extractorAgents?.map(agent => ({
      id: agent.id,
      name: agent.agent_name,
      icon: Search,
      status: agent.is_active ? 'active' as const : 'maintenance' as const,
      description: agent.description || 'Extrai dados das conversas',
      type: 'extractor' as const
    })) || [])
  ];

  const mappedLeadScorerAgents = leadScorerAgents?.map(agent => ({
    id: agent.id,
    name: agent.agent_name,
    icon: Brain,
    status: agent.is_active ? 'active' as const : 'maintenance' as const,
    description: agent.description || 'Avalia temperatura dos leads automaticamente'
  })) || [];

  return (
    <div className="space-y-6">
      {/* Tabs para Geral, Especialistas, Espiões, Leads, Qualidade e Resumos */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'general' | 'specialists' | 'spies' | 'leads' | 'summary' | 'quality')}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Atendimento Geral
          </TabsTrigger>
          <TabsTrigger value="specialists" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Especialistas
          </TabsTrigger>
          <TabsTrigger value="spies" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Agentes Espiões
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Avaliadores de Leads
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Monitor de Qualidade
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Gerador de Resumos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card do Agente Geral */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Atendimento Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingGeneral ? (
                    <div className="h-16 bg-muted rounded animate-pulse" />
                  ) : generalAgent ? (
                    <div
                      onClick={() => {
                        setSelectedAgent(generalAgent.id);
                        setSelectedAgentType('general');
                      }}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
                        ${selectedAgent === generalAgent.id && selectedAgentType === 'general'
                          ? 'bg-primary/10 border-primary shadow-sm' 
                          : 'bg-card border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          p-2 rounded-lg
                          ${selectedAgent === generalAgent.id && selectedAgentType === 'general' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {generalAgent.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {generalAgent.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="default" className="text-xs">
                              Ativo
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {localConfig?.llm_model === 'claude-3-5-sonnet-20241022' ? 'Claude 3.5 Sonnet' :
                               localConfig?.llm_model === 'claude-3-5-haiku-20241022' ? 'Claude 3.5 Haiku' :
                               localConfig?.llm_model === 'gpt-4o' ? 'GPT-4o' :
                               localConfig?.llm_model === 'gpt-4o-mini' ? 'GPT-4o Mini' :
                               localConfig?.llm_model || 'Claude 3.5 Sonnet'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      Carregando agente geral...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Editor do Agente Geral */}
            <div className="lg:col-span-2">
              {selectedAgent && selectedAgentType === 'general' && generalAgent && localConfig ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="w-5 h-5" />
                          Editor do Agente Geral
                        </CardTitle>
                        <CardDescription>
                          Configure o prompt e modelo LLM do agente responsável pelo atendimento inicial.
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {isEditingGeneral ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={isSaving}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveChanges}
                              disabled={isSaving}
                            >
                              {isSaving ? 'Salvando...' : 'Salvar'}
                            </Button>
                          </>
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
                    {/* Configurações básicas */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="agent-name">Nome do Agente</Label>
                        <Input
                          id="agent-name"
                          value={localConfig.name}
                          onChange={(e) => updateLocalConfig({ name: e.target.value })}
                          disabled={!isEditingGeneral}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="agent-description">Descrição</Label>
                        <Input
                          id="agent-description"
                          value={localConfig.description}
                          onChange={(e) => updateLocalConfig({ description: e.target.value })}
                          disabled={!isEditingGeneral}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Modelo LLM */}
                    <div>
                      <Label>Modelo LLM</Label>
                      {isEditingGeneral ? (
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
                             localConfig.llm_model === 'gpt-4o' ? 'GPT-4o' :
                             localConfig.llm_model === 'gpt-4o-mini' ? 'GPT-4o Mini' :
                             localConfig.llm_model}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Prompt Principal */}
                    <div>
                      <Label htmlFor="general-prompt">Prompt Principal</Label>
                      <Textarea
                        id="general-prompt"
                        value={localConfig.knowledge_base}
                        onChange={(e) => updateLocalConfig({ knowledge_base: e.target.value })}
                        disabled={!isEditingGeneral}
                        rows={15}
                        className="mt-2 font-mono text-sm"
                        placeholder="Configure o prompt do agente geral aqui..."
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {isEditingGeneral 
                          ? 'Use variáveis como {{customer_name}}, {{whatsapp_number}}, {{customer_city}} para personalizar as respostas.'
                          : 'Clique em "Editar" para modificar este prompt e o modelo LLM.'
                        }
                      </p>
                    </div>

                    {/* Status e Estatísticas */}
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
                        <Label className="text-xs text-muted-foreground">Categoria</Label>
                        <div className="mt-1">
                          <Badge variant="outline">Atendimento Geral</Badge>
                        </div>
                      </div>
                      <div className="text-center">
                        <Label className="text-xs text-muted-foreground">Última atualização</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {generalAgent.updated_at ? new Date(generalAgent.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Configure o Agente Geral
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Selecione o agente geral ao lado para visualizar e gerenciar suas configurações.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specialists">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar com Lista de Agentes Especialistas */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Especialistas
                  </CardTitle>
                </CardHeader>
                 <CardContent className="space-y-2">
                   {loadingSpecialists ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    mappedSpecialistAgents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        isSelected={selectedAgent === agent.id && selectedAgentType === 'specialist'}
                        onClick={() => {
                          setSelectedAgent(agent.id);
                          setSelectedAgentType('specialist');
                        }}
                      />
                    ))
                   )}
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">
                      Para criar novos agentes, use a tabela agent_prompts no banco de dados
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Área Principal - Editor de Prompt Especialista */}
            <div className="lg:col-span-2">
              {selectedAgent && selectedAgentType === 'specialist' ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Editor do Agente Especialista
                      </CardTitle>
                      <CardDescription>
                        Configure o prompt, LLM e base de conhecimento do agente especialista.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentConfigEditor agentId={selectedAgent} />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Selecione um agente especialista
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Escolha um agente especialista para configurar prompts, LLM e base de conhecimento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spies">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar com Lista de Agentes Espiões */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Agentes Espiões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(loadingClassifiers || loadingExtractors) ? (
                    <div className="space-y-2">
                      {[1, 2].map(i => (
                        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    mappedSpyAgents.map((agent) => (
                      <SpyAgentCard
                        key={agent.id}
                        agent={agent}
                        isSelected={selectedAgent === agent.id && selectedAgentType === agent.type}
                        onClick={() => {
                          setSelectedAgent(agent.id);
                          setSelectedAgentType(agent.type);
                        }}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Área Principal - Editor de Prompt Espião */}
            <div className="lg:col-span-2">
              {selectedAgent && (selectedAgentType === 'classifier' || selectedAgentType === 'extractor') ? (
                <EnhancedPromptEditor 
                  selectedAgent={selectedAgent as any} 
                  agentType={selectedAgentType}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Selecione um agente espião
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Escolha um agente espião para configurar seu prompt de análise, LLM e base de conhecimento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar com Lista de Agentes Avaliadores de Leads */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Avaliadores de Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loadingLeadScorers ? (
                    <div className="space-y-2">
                      {[1].map(i => (
                        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    mappedLeadScorerAgents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        isSelected={selectedAgent === agent.id && selectedAgentType === 'lead_scorer'}
                        onClick={() => {
                          setSelectedAgent(agent.id);
                          setSelectedAgentType('lead_scorer');
                        }}
                      />
                    ))
                   )}
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">
                      Para criar novos agentes, use a tabela agent_prompts no banco de dados
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Área Principal - Editor de Prompt Lead Scorer */}
            <div className="lg:col-span-2">
              {selectedAgent && selectedAgentType === 'lead_scorer' ? (
                <EnhancedPromptEditor 
                  selectedAgent={selectedAgent as any} 
                  agentType="lead_scorer"
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Selecione um avaliador de leads
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Escolha um agente avaliador para configurar seu prompt de análise, LLM e parâmetros.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <QualityMonitorAgentSection />
        </TabsContent>

        <TabsContent value="summary">
          <LeadSummaryAgentSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}