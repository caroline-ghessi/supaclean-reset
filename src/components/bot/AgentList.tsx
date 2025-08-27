import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Play, 
  MoreVertical,
  Clock
} from 'lucide-react';
import { ProductCategory } from '@/types/conversation.types';

interface AgentListProps {
  agents: ProductCategory[];
  selectedAgent: ProductCategory;
  onSelectAgent: (agent: ProductCategory) => void;
  agentIcons: Record<ProductCategory, any>;
  agentNames: Record<ProductCategory, string>;
  agentPrompts: any[];
  isLoading: boolean;
}

export function AgentList({
  agents,
  selectedAgent,
  onSelectAgent,
  agentIcons,
  agentNames,
  agentPrompts,
  isLoading
}: AgentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {agents.map((agent) => {
        const Icon = agentIcons[agent];
        const isSelected = selectedAgent === agent;
        const agentPrompt = agentPrompts?.find(p => p.category === agent);
        const hasPrompt = !!agentPrompt;

        return (
          <Card 
            key={agent}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => onSelectAgent(agent)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {agentNames[agent]}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {agent.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Badge 
                    variant={hasPrompt ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {hasPrompt ? 'Configurado' : 'Não configurado'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {agentPrompt?.updated_at ? 
                    new Date(agentPrompt.updated_at).toLocaleDateString() : 
                    'Nunca'
                  }
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Quick test action
                    }}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: More options
                    }}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}