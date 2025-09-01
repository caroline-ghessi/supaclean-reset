import React, { useState } from 'react';
import { 
  Bot, Settings, TestTube, Save, Plus, Edit3, Trash2, 
  ChevronRight, Code, MessageSquare, Zap, Brain, 
  FileText, Copy, History, AlertCircle, CheckCircle,
  Sparkles, Rocket, Database, ArrowRight, Layers,
  Sun, Home, Hammer, Wrench, PaintBucket, Eye, Search
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
import { useSpecialistAgents, useAgentsByType } from '@/hooks/useAgentConfigs';
import { SpyAgentCard } from './SpyAgentCard';
import { EnhancedPromptEditor } from './EnhancedPromptEditor';

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
  const [activeTab, setActiveTab] = useState<'specialists' | 'spies' | 'leads'>('specialists');
  const [selectedAgentType, setSelectedAgentType] = useState<'specialist' | 'classifier' | 'extractor' | 'lead_scorer'>('specialist');
  
  // Buscar agentes reais do banco de dados
  const { data: realSpecialistAgents, isLoading: loadingSpecialists } = useSpecialistAgents();
  const { data: classifierAgents, isLoading: loadingClassifiers } = useAgentsByType('classifier');
  const { data: extractorAgents, isLoading: loadingExtractors } = useAgentsByType('extractor');
  const { data: leadScorerAgents, isLoading: loadingLeadScorers } = useAgentsByType('lead_scorer');
  
  // Mapear agentes reais para o formato esperado
  const mappedSpecialistAgents = realSpecialistAgents?.map(agent => ({
    id: agent.product_category || agent.id,
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
      {/* Tabs para Especialistas, Espiões e Leads */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'specialists' | 'spies' | 'leads')}>
        <TabsList className="grid w-full grid-cols-3">
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
        </TabsList>

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
                <EnhancedPromptEditor 
                  selectedAgent={selectedAgent as any} 
                  agentType="specialist"
                />
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
      </Tabs>
    </div>
  );
}