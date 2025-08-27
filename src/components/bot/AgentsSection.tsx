import React, { useState } from 'react';
import { Plus, Brain, Edit3, Trash2, Copy } from 'lucide-react';
import { StepsEditor } from './StepsEditor';

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'inactive';
  conversations: number;
}

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg cursor-pointer transition-all border-2
        ${isSelected 
          ? 'bg-primary/5 border-primary' 
          : 'bg-muted/30 border-transparent hover:bg-muted/50'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <h3 className="font-medium text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.conversations} conversas</p>
          </div>
        </div>
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${agent.status === 'active' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-muted text-muted-foreground'
          }
        `}>
          {agent.status === 'active' ? 'Ativo' : 'Inativo'}
        </div>
      </div>
    </div>
  );
}

interface SectionTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function SectionTab({ active, onClick, label }: SectionTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }
      `}
    >
      {label}
    </button>
  );
}

interface PromptEditorProps {
  agentId: string;
}

function PromptEditor({ agentId }: PromptEditorProps) {
  const [activeSection, setActiveSection] = useState<'system' | 'steps' | 'examples'>('system');

  return (
    <div className="bg-card rounded-xl shadow-sm border">
      {/* Editor Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Configuração do Agente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Edite os prompts e comportamento do agente
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted/50 flex items-center gap-1">
              <Copy className="w-4 h-4" />
              Duplicar
            </button>
            <button className="px-3 py-1.5 text-sm border border-destructive text-destructive rounded-lg hover:bg-destructive/5 flex items-center gap-1">
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-4 mt-6">
          <SectionTab
            active={activeSection === 'system'}
            onClick={() => setActiveSection('system')}
            label="Prompt Sistema"
          />
          <SectionTab
            active={activeSection === 'steps'}
            onClick={() => setActiveSection('steps')}
            label="Steps de Conversa"
          />
          <SectionTab
            active={activeSection === 'examples'}
            onClick={() => setActiveSection('examples')}
            label="Exemplos"
          />
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6">
        {activeSection === 'system' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Prompt do Sistema
              </label>
              <textarea
                className="w-full h-64 p-4 border rounded-lg font-mono text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Você é um agente especializado em..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use variáveis como {`{{customer_name}}`}, {`{{product_group}}`}, {`{{lead_score}}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Personalidade e Tom
              </label>
              <div className="grid grid-cols-2 gap-4">
                <select className="p-2 border rounded-lg text-sm bg-background">
                  <option>Profissional</option>
                  <option>Amigável</option>
                  <option>Consultivo</option>
                </select>
                <select className="p-2 border rounded-lg text-sm bg-background">
                  <option>Formal</option>
                  <option>Casual</option>
                  <option>Técnico</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'steps' && <StepsEditor agentId={agentId} />}

        {activeSection === 'examples' && (
          <div className="p-8 text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Editor de exemplos em construção...</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentsSectionProps {
  selectedAgent: string | null;
  setSelectedAgent: (id: string | null) => void;
}

export function AgentsSection({ selectedAgent, setSelectedAgent }: AgentsSectionProps) {
  const agents: Agent[] = [
    { id: 'energia_solar', name: 'Energia Solar', icon: '☀️', status: 'active', conversations: 1250 },
    { id: 'telha_shingle', name: 'Telhas Shingle', icon: '🏠', status: 'active', conversations: 890 },
    { id: 'steel_frame', name: 'Steel Frame', icon: '🏗️', status: 'active', conversations: 567 },
    { id: 'drywall', name: 'Drywall', icon: '🧱', status: 'inactive', conversations: 234 },
    { id: 'ferramentas', name: 'Ferramentas', icon: '🔧', status: 'active', conversations: 1456 },
  ];

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Lista de Agentes - Sidebar */}
      <div className="col-span-4">
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Agentes Especializados</h2>
            <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent === agent.id}
                onClick={() => setSelectedAgent(agent.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Editor de Prompts - Main Content */}
      <div className="col-span-8">
        {selectedAgent ? (
          <PromptEditor agentId={selectedAgent} />
        ) : (
          <div className="bg-card rounded-xl shadow-sm border p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Selecione um agente
              </h3>
              <p className="text-sm text-muted-foreground">
                Escolha um agente na lista ao lado para editar seus prompts e configurações
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}