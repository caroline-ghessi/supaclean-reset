import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  condition: string;
  prompt: string;
}

interface StepsEditorProps {
  agentId: string;
}

export function StepsEditor({ agentId }: StepsEditorProps) {
  const steps: Step[] = [
    { 
      id: 1, 
      name: 'Saudação', 
      condition: 'Sempre', 
      prompt: 'Olá! Como posso ajudar você hoje com suas necessidades de energia solar?' 
    },
    { 
      id: 2, 
      name: 'Coletar Consumo', 
      condition: 'Se energy_consumption vazio', 
      prompt: 'Para fazer um orçamento preciso, qual o valor médio da sua conta de luz?' 
    },
    { 
      id: 3, 
      name: 'Oferecer Bateria', 
      condition: 'Se tem consumo', 
      prompt: 'Perfeito! Você gostaria de incluir um sistema de baterias no seu projeto?' 
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div 
          key={step.id} 
          className="border rounded-lg p-4 hover:border-primary/50 transition-colors bg-muted/20"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{step.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">Condição: {step.condition}</p>
                <div className="mt-3">
                  <textarea
                    className="w-full p-3 border rounded-lg text-sm bg-background text-foreground resize-none"
                    rows={2}
                    defaultValue={step.prompt}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button className="p-1.5 hover:bg-muted rounded transition-colors">
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-1.5 hover:bg-destructive/10 rounded transition-colors">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button className="w-full p-4 border-2 border-dashed border-muted rounded-lg hover:border-primary/50 transition-colors group">
        <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary mx-auto mb-1 transition-colors" />
        <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
          Adicionar Step
        </span>
      </button>
    </div>
  );
}