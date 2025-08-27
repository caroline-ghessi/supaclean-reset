import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, History, TestTube, Copy, Trash, Edit3 } from 'lucide-react';
import { ProductCategory } from '@/types/conversation.types';
import {
  useAgentPrompt,
  usePromptSteps,
  usePromptVariables,
  useUpdatePromptStep,
  useDeletePromptStep,
  useTestPrompt
} from '@/hooks/useAgentPrompts';

export function PromptsAdminPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('energia_solar');
  const [testMode, setTestMode] = useState(false);

  const categories: ProductCategory[] = [
    'energia_solar',
    'telha_shingle',
    'steel_frame',
    'drywall_divisorias',
    'ferramentas',
    'pisos',
    'acabamentos',
    'forros',
    'saudacao',
    'institucional'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gerenciador de Prompts do Bot
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure as respostas e fluxos de cada agente especializado
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setTestMode(!testMode)}
                className={testMode ? 'border-primary' : ''}
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testMode ? 'Modo Teste Ativo' : 'Testar Prompts'}
              </Button>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Categories */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Categorias de Agentes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <CategoryItem
                      key={category}
                      category={category}
                      isSelected={selectedCategory === category}
                      onClick={() => setSelectedCategory(category)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Variables Reference */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Variáveis Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <VariablesList />
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Prompt Editor */}
          <div className="col-span-9">
            <Card>
              <CardContent className="p-6">
                <PromptEditor 
                  category={selectedCategory}
                  testMode={testMode}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Category Item
function CategoryItem({ 
  category, 
  isSelected, 
  onClick 
}: {
  category: ProductCategory;
  isSelected: boolean;
  onClick: () => void;
}) {
  const categoryLabels = {
    energia_solar: '☀️ Energia Solar',
    telha_shingle: '🏠 Telha Shingle',
    steel_frame: '🏗️ Steel Frame',
    drywall_divisorias: '🧱 Drywall',
    ferramentas: '🔧 Ferramentas',
    pisos: '🏢 Pisos',
    acabamentos: '🎨 Acabamentos',
    forros: '📐 Forros',
    saudacao: '👋 Saudação',
    institucional: 'ℹ️ Institucional',
    indefinido: '❓ Indefinido'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
        isSelected 
          ? 'bg-primary/10 text-primary font-medium' 
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      {categoryLabels[category] || category}
    </button>
  );
}

// Component: Variables List
function VariablesList() {
  const { data: variables } = usePromptVariables();

  const groupedVariables = variables?.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, any[]>) || {};

  return (
    <div className="space-y-4">
      {Object.entries(groupedVariables).map(([category, vars]) => (
        <div key={category}>
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
            {category}
          </h4>
          <div className="space-y-2">
            {vars.map((variable) => (
              <div
                key={variable.id}
                className="p-2 bg-muted/50 rounded text-xs"
              >
                <code className="text-primary font-mono">
                  {variable.variable_name}
                </code>
                <p className="text-muted-foreground mt-1">
                  {variable.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Component: Prompt Editor
function PromptEditor({ 
  category, 
  testMode 
}: {
  category: ProductCategory;
  testMode: boolean;
}) {
  const { data: agentPrompt, isLoading } = useAgentPrompt(category);
  const { data: promptSteps } = usePromptSteps(agentPrompt?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Configuração do Agente: {category}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {agentPrompt?.description || 'Configure os prompts e fluxo de conversa'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={agentPrompt?.is_active ? 'default' : 'secondary'}>
            {agentPrompt?.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
          <Badge variant="outline">
            Versão {agentPrompt?.version || 1}
          </Badge>
        </div>
      </div>

      {/* Steps/Prompts */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList>
          <TabsTrigger value="steps">Etapas do Fluxo</TabsTrigger>
          <TabsTrigger value="test">Testar</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-6">
          <StepsEditor 
            steps={promptSteps || []}
            agentPromptId={agentPrompt?.id}
          />
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          <PromptTester 
            category={category}
            agentPromptId={agentPrompt?.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component: Steps Editor
function StepsEditor({ 
  steps, 
  agentPromptId 
}: {
  steps: any[];
  agentPromptId?: string;
}) {
  const [newStep, setNewStep] = useState(false);
  const updateStep = useUpdatePromptStep();
  const deleteStep = useDeletePromptStep();

  return (
    <div className="space-y-4">
      {/* Steps List */}
      {steps.map((step, index) => (
        <StepCard
          key={step.id}
          step={step}
          index={index}
          onUpdate={(data) => updateStep.mutate({ id: step.id, ...data })}
          onDelete={() => deleteStep.mutate(step.id)}
        />
      ))}

      {/* Add New Step */}
      {newStep ? (
        <NewStepForm
          agentPromptId={agentPromptId}
          onSave={() => setNewStep(false)}
          onCancel={() => setNewStep(false)}
        />
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setNewStep(true)}
          disabled={!agentPromptId}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Nova Etapa
        </Button>
      )}
    </div>
  );
}

// Component: Step Card
function StepCard({ 
  step, 
  index, 
  onUpdate, 
  onDelete 
}: {
  step: any;
  index: number;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(step);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="border-primary/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                value={formData.step_key}
                onChange={(e) => setFormData({ ...formData, step_key: e.target.value })}
                placeholder="Chave da etapa (ex: collect_phone)"
                className="max-w-xs"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordem:</span>
                <Input
                  type="number"
                  value={formData.step_order}
                  onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) })}
                  className="w-20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Campo Condicional (deixe vazio se sempre executar)
              </label>
              <Input
                value={formData.condition_field || ''}
                onChange={(e) => setFormData({ ...formData, condition_field: e.target.value })}
                placeholder="Ex: project_contexts.whatsapp_confirmed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Template do Prompt
              </label>
              <Textarea
                value={formData.prompt_template}
                onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                rows={6}
                className="font-mono text-sm"
                placeholder="Use {{variáveis}} para valores dinâmicos"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suporta Markdown e variáveis como {`{{customer_name}}`}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar Etapa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">{index + 1}</Badge>
              <span className="font-medium">{step.step_key}</span>
              {step.condition_field && (
                <Badge variant="secondary" className="text-xs">
                  Se !{step.condition_field}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              {step.prompt_template.substring(0, 150)}...
            </div>

            {step.quick_replies && step.quick_replies.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {step.quick_replies.map((reply: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {reply}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete()}
              className="text-destructive hover:text-destructive"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component: New Step Form
function NewStepForm({ 
  agentPromptId, 
  onSave, 
  onCancel 
}: {
  agentPromptId?: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    agent_prompt_id: agentPromptId,
    step_key: '',
    step_order: 1,
    condition_field: '',
    prompt_template: '',
    quick_replies: []
  });

  const updateStep = useUpdatePromptStep();

  const handleSave = () => {
    updateStep.mutate(formData, {
      onSuccess: () => {
        onSave();
      }
    });
  };

  return (
    <Card className="border-primary/50">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              value={formData.step_key}
              onChange={(e) => setFormData({ ...formData, step_key: e.target.value })}
              placeholder="Chave da etapa (ex: collect_phone)"
              className="max-w-xs"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordem:</span>
              <Input
                type="number"
                value={formData.step_order}
                onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) })}
                className="w-20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Campo Condicional
            </label>
            <Input
              value={formData.condition_field}
              onChange={(e) => setFormData({ ...formData, condition_field: e.target.value })}
              placeholder="Ex: project_contexts.whatsapp_confirmed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Template do Prompt
            </label>
            <Textarea
              value={formData.prompt_template}
              onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Etapa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component: Prompt Tester
function PromptTester({ 
  category, 
  agentPromptId 
}: {
  category: ProductCategory;
  agentPromptId?: string;
}) {
  const [testMessage, setTestMessage] = useState('');
  const [testContext, setTestContext] = useState({
    customer_name: 'João Teste',
    whatsapp_number: '51999887766',
    product_group: category,
    lead_score: 50,
    project_contexts: {}
  });

  const testPrompt = useTestPrompt();

  const handleTest = () => {
    if (!agentPromptId) return;
    
    testPrompt.mutate({
      agentPromptId,
      message: testMessage,
      context: testContext
    });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Input Side */}
      <div className="space-y-4">
        <h3 className="font-semibold">Configurar Teste</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Mensagem do Cliente
          </label>
          <Textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Digite uma mensagem de teste..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Contexto de Teste (JSON)
          </label>
          <Textarea
            value={JSON.stringify(testContext, null, 2)}
            onChange={(e) => {
              try {
                setTestContext(JSON.parse(e.target.value));
              } catch {}
            }}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        <Button 
          onClick={handleTest}
          className="w-full"
          disabled={!agentPromptId || testPrompt.isPending}
        >
          <TestTube className="w-4 h-4 mr-2" />
          {testPrompt.isPending ? 'Testando...' : 'Executar Teste'}
        </Button>
      </div>

      {/* Result Side */}
      <div className="space-y-4">
        <h3 className="font-semibold">Resultado do Teste</h3>
        
        {testPrompt.data && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Resposta do Bot:</span>
                  <div className="mt-1 p-3 bg-background rounded-lg">
                    {testPrompt.data.response}
                  </div>
                </div>

                {testPrompt.data.quickReplies && (
                  <div>
                    <span className="text-xs text-muted-foreground">Quick Replies:</span>
                    <div className="mt-1 flex gap-2 flex-wrap">
                      {testPrompt.data.quickReplies.map((reply: string, i: number) => (
                        <Badge key={i}>{reply}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs text-muted-foreground">Metadata:</span>
                  <pre className="mt-1 text-xs bg-background p-2 rounded overflow-auto">
                    {JSON.stringify(testPrompt.data.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {testPrompt.error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">
                Erro: {testPrompt.error.message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}