import { useState } from 'react';
import { Plus, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RuleCard } from './RuleCard';

export function FlowsTab() {
  const [rules] = useState([
    {
      id: '1',
      name: 'Urgência detectada',
      condition: 'Se contém "urgente" ou "hoje"',
      action: 'Aumenta score em +20 e marca como prioritário',
      active: true
    },
    {
      id: '2',
      name: 'Cliente recorrente',
      condition: 'Se é cliente recorrente',
      action: 'Pula classificação e vai direto para último agente usado',
      active: true
    },
    {
      id: '3',
      name: 'Valor alto mencionado',
      condition: 'Se menciona valor acima de R$ 10.000',
      action: 'Marca como lead quente automaticamente',
      active: false
    },
    {
      id: '4',
      name: 'Orçamento solicitado',
      condition: 'Se menciona "preço", "valor", "orçamento"',
      action: 'Define flag wants_budget como true',
      active: true
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Fluxograma Visual */}
      <div className="bg-muted rounded-lg p-6">
        <h3 className="font-medium text-foreground mb-4">Fluxo de Classificação</h3>
        
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Receber mensagem do cliente</p>
              <p className="text-sm text-muted-foreground">Aguarda 60 segundos por mensagens adicionais</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="ml-5 w-0.5 h-8 bg-border"></div>

          {/* Step 2 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Analisar palavras-chave</p>
              <p className="text-sm text-muted-foreground">Busca matches nas categorias configuradas</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="ml-5 w-0.5 h-8 bg-border"></div>

          {/* Step 3 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Calcular confiança</p>
              <p className="text-sm text-muted-foreground">Mínimo 70% para classificação automática</p>
            </div>
          </div>

          {/* Decision Point */}
          <div className="ml-5 flex items-center gap-4">
            <div className="w-0.5 h-8 bg-border"></div>
            <div className="flex gap-4 flex-1">
              <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Confiança ≥ 70%</p>
                <p className="text-xs text-green-600 mt-1">Roteia para agente especializado</p>
              </div>
              <div className="flex-1 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800">Confiança &lt; 70%</p>
                <p className="text-xs text-orange-600 mt-1">Mostra opções ao cliente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regras Customizadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Regras Especiais</h3>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Regra
          </Button>
        </div>
        
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              condition={rule.condition}
              action={rule.action}
              active={rule.active}
            />
          ))}
        </div>

        <Button 
          variant="outline" 
          className="mt-4 w-full border-dashed text-muted-foreground hover:text-foreground hover:border-primary"
        >
          + Adicionar Nova Regra
        </Button>
      </div>
    </div>
  );
}