import React from 'react';

interface LLMCardProps {
  name: string;
  description: string;
  status: 'active' | 'available' | 'offline';
  icon: string;
  color: 'orange' | 'purple' | 'green';
}

function LLMCard({ name, description, status, icon, color }: LLMCardProps) {
  const colorClasses = {
    orange: 'border-primary bg-primary/5',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/10',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/10',
  };

  const statusConfig = {
    active: { text: 'Ativo', class: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
    available: { text: 'Disponível', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
    offline: { text: 'Offline', class: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className={`p-6 rounded-xl border-2 ${status === 'active' ? colorClasses[color] : 'border-border bg-card'} transition-all hover:shadow-md cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status].class}`}>
          {statusConfig[status].text}
        </span>
      </div>
      <h3 className="font-semibold text-foreground mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      
      {status === 'active' && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tokens hoje: 125.4k</span>
            <span>Custo: R$ 2.35</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function LLMSection() {
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-sm border p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Configuração de Modelos de IA</h2>
        
        <div className="grid grid-cols-3 gap-6">
          <LLMCard
            name="Grok (XAI)"
            description="Análise rápida e inteligente"
            status="active"
            icon="🤖"
            color="orange"
          />
          <LLMCard
            name="Claude (Anthropic)"
            description="Raciocínio avançado e contextual"
            status="available"
            icon="🧠"
            color="purple"
          />
          <LLMCard
            name="ChatGPT (OpenAI)"
            description="Conversação natural e fluida"
            status="offline"
            icon="💬"
            color="green"
          />
        </div>

        <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
          <h3 className="font-medium text-foreground mb-4">Configurações Avançadas</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Temperatura
              </label>
              <input 
                type="range" 
                className="w-full accent-primary" 
                min="0" 
                max="1" 
                step="0.1" 
                defaultValue="0.7"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Preciso</span>
                <span>Criativo</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Tokens
              </label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-lg bg-background text-foreground"
                defaultValue="2048"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}