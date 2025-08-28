import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SpyAgent {
  id: string;
  name: string;
  icon: LucideIcon;
  status: 'active' | 'maintenance';
  description: string;
  type: 'classifier' | 'extractor';
}

interface SpyAgentCardProps {
  agent: SpyAgent;
  isSelected: boolean;
  onClick: () => void;
}

export function SpyAgentCard({ agent, isSelected, onClick }: SpyAgentCardProps) {
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
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {agent.description}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="text-xs">
              {agent.type === 'classifier' ? 'Classificador' : 'Extrator'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}