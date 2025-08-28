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
  const [activeTab, setActiveTab] = useState<'specialists' | 'spies'>('specialists');
  const [selectedAgentType, setSelectedAgentType] = useState<'specialist' | 'classifier' | 'extractor'>('specialist');
  
  // Buscar agentes reais do banco de dados
  const { data: realSpecialistAgents, isLoading: loadingSpecialists } = useSpecialistAgents();
  const { data: classifierAgents, isLoading: loadingClassifiers } = useAgentsByType('classifier');
  const { data: extractorAgents, isLoading: loadingExtractors } = useAgentsByType('extractor');
  
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

  return (
    <div className="space-y-6">
      {/* Tabs para Especialistas vs Espiões */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'specialists' | 'spies')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="specialists" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Agentes Especialistas
          </TabsTrigger>
          <TabsTrigger value="spies" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Agentes Espiões
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
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 flex items-center gap-2"
                    onClick={() => window.location.href = '/bot?tab=config'}
                  >
                    <Plus className="w-4 h-4" />
                    Criar Novo Agente
                  </Button>
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
      </Tabs>
    </div>
  );
}