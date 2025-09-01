import React, { useState, useEffect } from 'react';
import { 
  Bot, Settings, TestTube, Save, Plus, Edit3, Trash2, 
  ChevronRight, Code, MessageSquare, Zap, Brain, 
  FileText, Copy, History, AlertCircle, CheckCircle,
  Sparkles, Rocket, Database, ArrowRight
} from 'lucide-react';
import { OverviewSection } from '@/components/bot/OverviewSection';
import { AgentsSection } from '@/components/bot/AgentsSection';
import { LLMSection } from '@/components/bot/LLMSection';
import { TestSection } from '@/components/bot/TestSection';
import { MasterAgentSection } from '@/components/bot/MasterAgentSection';
import { ClassificationLogsSection } from '@/components/bot/ClassificationLogsSection';
import { ClassificationStats } from '@/components/bot/ClassificationStats';
import { RAGSection } from '@/components/bot/RAGSection';
import { AgentConfigurationSection } from '@/components/bot/AgentConfigurationSection';

type ActiveTab = 'overview' | 'agents' | 'llm' | 'rag' | 'test';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium
        ${active 
          ? 'bg-card text-primary shadow-sm' 
          : 'text-muted-foreground hover:text-foreground'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function BotPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Verificar se há parâmetro 'tab' na URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ActiveTab;
    if (tab && ['overview', 'agents', 'llm', 'rag', 'test'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/50">
      {/* Header Principal com Navegação */}
      <div className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Bot Inteligente</h1>
                  <p className="text-xs text-muted-foreground">Sistema de IA para atendimento</p>
                </div>
              </div>
            </div>

            {/* Tabs de Navegação */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={<Sparkles className="w-4 h-4" />}
                label="Visão Geral"
              />
              <TabButton
                active={activeTab === 'agents'}
                onClick={() => setActiveTab('agents')}
                icon={<Brain className="w-4 h-4" />}
                label="Agentes"
              />
              <TabButton
                active={activeTab === 'llm'}
                onClick={() => setActiveTab('llm')}
                icon={<Zap className="w-4 h-4" />}
                label="Modelos IA"
              />
              <TabButton
                active={activeTab === 'rag'}
                onClick={() => setActiveTab('rag')}
                icon={<Database className="w-4 h-4" />}
                label="Sistema RAG"
              />
              <TabButton
                active={activeTab === 'test'}
                onClick={() => setActiveTab('test')}
                icon={<TestTube className="w-4 h-4" />}
                label="Testar"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <History className="w-4 h-4 inline mr-2" />
                Histórico
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div>
            <OverviewSection />
            <ClassificationStats />
            <ClassificationLogsSection />
          </div>
        )}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <MasterAgentSection />
            <AgentsSection 
              selectedAgent={selectedAgent} 
              setSelectedAgent={setSelectedAgent} 
            />
          </div>
        )}
        {activeTab === 'llm' && <LLMSection />}
        {activeTab === 'rag' && <RAGSection />}
        {activeTab === 'test' && <TestSection />}
      </div>
    </div>
  );
}