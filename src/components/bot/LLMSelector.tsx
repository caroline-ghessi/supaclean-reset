import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Brain, 
  Zap, 
  MessageSquare, 
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface LLMSelectorProps {
  selectedLLM: 'grok' | 'claude' | 'chatgpt';
  onSelectLLM: (llm: 'grok' | 'claude' | 'chatgpt') => void;
}

const LLM_CONFIG = {
  grok: {
    name: 'Grok (XAI)',
    description: 'Análise rápida e inteligente',
    icon: Zap,
    status: 'online' as const,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  claude: {
    name: 'Claude (Anthropic)',
    description: 'Raciocínio avançado e contextual',
    icon: Brain,
    status: 'online' as const,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
  chatgpt: {
    name: 'ChatGPT (OpenAI)',
    description: 'Conversação natural e fluída',
    icon: MessageSquare,
    status: 'offline' as const,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  }
};

export function LLMSelector({ selectedLLM, onSelectLLM }: LLMSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de LLM
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(LLM_CONFIG) as Array<keyof typeof LLM_CONFIG>).map((llmKey) => {
            const llm = LLM_CONFIG[llmKey];
            const Icon = llm.icon;
            const isSelected = selectedLLM === llmKey;
            const isOnline = llm.status === 'online';

            return (
              <Button
                key={llmKey}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onSelectLLM(llmKey)}
                className={`h-auto p-4 flex flex-col items-start gap-2 ${
                  isSelected ? '' : 'hover:bg-muted/50'
                }`}
                disabled={!isOnline}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-lg ${llm.bgColor}`}>
                    <Icon className={`h-5 w-5 ${llm.color}`} />
                  </div>
                  {isOnline ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="text-left">
                  <div className="font-semibold text-sm">{llm.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {llm.description}
                  </div>
                  <Badge 
                    variant={isOnline ? 'secondary' : 'destructive'}
                    className="mt-2 text-xs"
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Advanced Settings */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Configurações Avançadas</h4>
              <p className="text-sm text-muted-foreground">
                Ajuste parâmetros da LLM selecionada
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}