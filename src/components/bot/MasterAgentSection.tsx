import { useState } from 'react';
import { 
  Brain, 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  Tag, 
  GitBranch 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MasterConfigTab } from './MasterConfigTab';
import { KeywordsTab } from './KeywordsTab';
import { FlowsTab } from './FlowsTab';
import { useClassificationStats } from '@/hooks/useClassificationLogs';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      className={`flex items-center gap-2 h-9 px-3 ${
        active 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Button>
  );
}

export function MasterAgentSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'keywords' | 'flows'>('config');
  const { data: stats } = useClassificationStats();

  return (
    <div className="mb-6">
      {/* Card Principal do Agente Mestre */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Agente de Classificação Master</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Primeiro contato • Identifica intenção • Roteia conversas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-purple-200">Classificações hoje</p>
                <p className="text-2xl font-bold">{stats?.totalClassifications || 0}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-3 bg-white/20 text-white hover:bg-white/30"
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-purple-200">Taxa de Acerto</p>
              <p className="text-xl font-bold">{stats?.accuracyRate || 0}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-purple-200">Não Classificados</p>
              <p className="text-xl font-bold">{stats?.unclassified || 0}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-purple-200">Tempo Médio</p>
              <p className="text-xl font-bold">{stats?.averageTime?.toFixed(1) || '0.0'}s</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-purple-200">Categorias</p>
              <p className="text-xl font-bold">10</p>
            </div>
          </div>
        </div>

        {/* Área Expandida de Configuração */}
        {isExpanded && (
          <div className="bg-background border-t border-purple-400">
            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex gap-1 px-6 pt-4">
                <TabButton
                  active={activeTab === 'config'}
                  onClick={() => setActiveTab('config')}
                  icon={<Settings className="w-4 h-4" />}
                  label="Configurações"
                />
                <TabButton
                  active={activeTab === 'keywords'}
                  onClick={() => setActiveTab('keywords')}
                  icon={<Tag className="w-4 h-4" />}
                  label="Palavras-chave (84)"
                />
                <TabButton
                  active={activeTab === 'flows'}
                  onClick={() => setActiveTab('flows')}
                  icon={<GitBranch className="w-4 h-4" />}
                  label="Fluxos"
                />
              </div>
            </div>

            {/* Conteúdo das Tabs */}
            <div className="p-6">
              {activeTab === 'config' && <MasterConfigTab />}
              {activeTab === 'keywords' && <KeywordsTab />}
              {activeTab === 'flows' && <FlowsTab />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}