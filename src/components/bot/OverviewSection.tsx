import React from 'react';
import { MessageSquare, Bot, Zap, Rocket, Plus, Brain, Database } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { QuickActionCard } from './QuickActionCard';

interface ActivityItemProps {
  action: string;
  target: string;
  time: string;
  user: string;
}

function ActivityItem({ action, target, time, user }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        <div>
          <p className="text-sm font-medium text-foreground">{action}</p>
          <p className="text-xs text-muted-foreground">{target}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{time}</p>
        <p className="text-xs text-muted-foreground">{user}</p>
      </div>
    </div>
  );
}

export function OverviewSection() {
  return (
    <div className="space-y-8">
      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatusCard
          title="Conversas Hoje"
          value="142"
          change="+12%"
          icon={<MessageSquare />}
          color="blue"
        />
        <StatusCard
          title="Taxa Resolução Bot"
          value="78%"
          change="+5%"
          icon={<Bot />}
          color="green"
        />
        <StatusCard
          title="Tempo Médio"
          value="2.3 min"
          change="-18%"
          icon={<Zap />}
          color="orange"
        />
        <StatusCard
          title="Leads Qualificados"
          value="31"
          change="+22%"
          icon={<Rocket />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-3 gap-4">
          <QuickActionCard
            title="Configurar novo agente"
            description="Adicione um novo agente especializado"
            icon={<Plus />}
            onClick={() => {}}
          />
          <QuickActionCard
            title="Treinar com conversas"
            description="Melhore o bot com conversas reais"
            icon={<Brain />}
            onClick={() => {}}
          />
          <QuickActionCard
            title="Análise de performance"
            description="Veja métricas detalhadas do bot"
            icon={<Database />}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h2>
        <div className="space-y-3">
          <ActivityItem
            action="Prompt atualizado"
            target="Agente Energia Solar"
            time="Há 2 horas"
            user="Admin"
          />
          <ActivityItem
            action="Novo agente criado"
            target="Agente Acabamentos"
            time="Há 5 horas"
            user="Caroline"
          />
          <ActivityItem
            action="Modelo IA alterado"
            target="Claude para Grok"
            time="Ontem"
            user="Sistema"
          />
        </div>
      </div>
    </div>
  );
}