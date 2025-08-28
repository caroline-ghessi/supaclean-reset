import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Save, 
  Settings, 
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ProductCategory } from '@/types/conversation.types';
import { useAgentPrompt } from '@/hooks/useAgentPrompts';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PromptEditorProps {
  selectedAgent: ProductCategory;
  selectedLLM: 'grok' | 'claude' | 'chatgpt';
  agentName: string;
}

export function PromptEditor({ selectedAgent, selectedLLM, agentName }: PromptEditorProps) {
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  const { data: agentPrompt, isLoading: isLoadingPrompt } = useAgentPrompt(selectedAgent);
  const { data: promptSteps, isLoading: isLoadingSteps } = usePromptSteps(agentPrompt?.id);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  if (isLoadingPrompt || isLoadingSteps) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{agentName}</h2>
            <p className="text-muted-foreground">
              Configure prompts e fluxo de conversa para este agente
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{selectedLLM.toUpperCase()}</Badge>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Agent Info */}
        {agentPrompt && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Nome</p>
                  <p className="text-sm text-muted-foreground">{agentPrompt.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Versão</p>
                  <p className="text-sm text-muted-foreground">v{agentPrompt.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Atualizado</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(agentPrompt.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!agentPrompt ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Agente não configurado</h3>
              <p className="text-muted-foreground mb-4">
                Este agente ainda não possui prompts configurados. 
                Crie o primeiro prompt para começar.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Prompt
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Steps Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Steps de Conversa ({promptSteps?.length || 0})
              </h3>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Step
              </Button>
            </div>

            {/* Steps List */}
            {promptSteps?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h4 className="font-semibold mb-2">Nenhum step configurado</h4>
                  <p className="text-muted-foreground mb-4">
                    Adicione steps para definir o fluxo de conversa
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Step
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {promptSteps?.map((step, index) => (
                  <Card key={step.id}>
                    <Collapsible 
                      open={expandedSteps.includes(step.id)}
                      onOpenChange={() => toggleStep(step.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                {step.step_order}
                              </Badge>
                              <div>
                                <CardTitle className="text-base">
                                  Step {step.step_order}: {step.step_key}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {step.prompt_template.substring(0, 100)}...
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {expandedSteps.includes(step.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <Separator className="mb-4" />
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Chave do Step
                              </label>
                              <Input value={step.step_key} readOnly />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Campo de Condição
                              </label>
                              <Input value={step.condition_field || ''} readOnly />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block">
                              Template do Prompt
                            </label>
                            <Textarea
                              value={step.prompt_template}
                              readOnly
                              className="min-h-32 font-mono text-sm"
                            />
                          </div>

                          {step.quick_replies && (
                            <div className="mb-4">
                              <label className="text-sm font-medium mb-2 block">
                                Quick Replies
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(step.quick_replies as string[]).map((reply, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {reply}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Próximo step: {step.next_step || 'Fim do fluxo'}
                            </div>
                            
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Step
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}