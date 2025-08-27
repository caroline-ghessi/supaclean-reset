import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  Play, 
  Search,
  Sun,
  Home,
  Building,
  Wrench,
  Layers,
  PaintBucket,
  Grid,
  Users
} from 'lucide-react';
import { AgentList } from '@/components/bot/AgentList';
import { PromptEditor } from '@/components/bot/PromptEditor';
import { PromptTester } from '@/components/bot/PromptTester';
import { LLMSelector } from '@/components/bot/LLMSelector';
import { useAgentPrompts } from '@/hooks/useAgentPrompts';
import { ProductCategory } from '@/types/conversation.types';

const AGENT_ICONS: Record<ProductCategory, any> = {
  energia_solar: Sun,
  telha_shingle: Home,
  steel_frame: Building,
  drywall_divisorias: Layers,
  ferramentas: Wrench,
  pisos: Grid,
  acabamentos: PaintBucket,
  forros: Layers,
  saudacao: Users,
  institucional: MessageSquare,
  indefinido: Bot
};

const AGENT_NAMES: Record<ProductCategory, string> = {
  energia_solar: 'Energia Solar',
  telha_shingle: 'Telhas Shingle',
  steel_frame: 'Steel Frame',
  drywall_divisorias: 'Drywall & Divisórias',
  ferramentas: 'Ferramentas',
  pisos: 'Pisos',
  acabamentos: 'Acabamentos',
  forros: 'Forros',
  saudacao: 'Saudação',
  institucional: 'Institucional',
  indefinido: 'Geral'
};

export default function BotPage() {
  const [selectedAgent, setSelectedAgent] = useState<ProductCategory>('energia_solar');
  const [selectedLLM, setSelectedLLM] = useState<'grok' | 'claude' | 'chatgpt'>('grok');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'tester'>('editor');

  const { data: agentPrompts, isLoading } = useAgentPrompts();

  const filteredAgents = Object.keys(AGENT_NAMES).filter(category =>
    AGENT_NAMES[category as ProductCategory].toLowerCase().includes(searchTerm.toLowerCase())
  ) as ProductCategory[];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Bot Inteligente</h1>
                <p className="text-muted-foreground">
                  Gerencie agentes especializados e configure LLMs
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                {Object.keys(AGENT_NAMES).length} Agentes
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {selectedLLM.toUpperCase()} Ativo
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Selector */}
      <div className="border-b bg-card/50">
        <div className="p-4">
          <LLMSelector
            selectedLLM={selectedLLM}
            onSelectLLM={setSelectedLLM}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Agents List */}
        <div className="w-80 border-r bg-card/30 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar agentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <AgentList
              agents={filteredAgents}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
              agentIcons={AGENT_ICONS}
              agentNames={AGENT_NAMES}
              agentPrompts={agentPrompts}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b bg-card/50">
            <div className="flex">
              <Button
                variant={activeTab === 'editor' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('editor')}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Settings className="h-4 w-4 mr-2" />
                Editor de Prompts
              </Button>
              <Button
                variant={activeTab === 'tester' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('tester')}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Play className="h-4 w-4 mr-2" />
                Testador
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' ? (
              <PromptEditor
                selectedAgent={selectedAgent}
                selectedLLM={selectedLLM}
                agentName={AGENT_NAMES[selectedAgent]}
              />
            ) : (
              <PromptTester
                selectedAgent={selectedAgent}
                selectedLLM={selectedLLM}
                agentName={AGENT_NAMES[selectedAgent]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}