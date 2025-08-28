import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Save, TestTube, Copy, Bot, MessageSquare, Database } from 'lucide-react';
import { ProductCategory } from '@/types/conversation.types';
import {
  useAgentPrompt,
  usePromptVariables,
  useTestPrompt,
  useUpdateAgentPrompt
} from '@/hooks/useAgentPrompts';
import { toast } from 'sonner';

export function PromptsAdminPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('energia_solar');

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
                Gerenciador de Prompts dos Agentes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure o prompt principal de cada agente especializado - sem steps, apenas um prompt único
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Sistema Simplificado
              </Badge>
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
                <CardTitle className="text-base">Agentes Disponíveis</CardTitle>
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
                <SimplifiedPromptEditor 
                  category={selectedCategory}
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

// Component: Simplified Prompt Editor (sem steps)
function SimplifiedPromptEditor({ 
  category
}: {
  category: ProductCategory;
}) {
  const { data: agentPrompt, isLoading } = useAgentPrompt(category);
  const updateAgentPrompt = useUpdateAgentPrompt();
  const [isSaving, setIsSaving] = useState(false);
  
  const [localPrompt, setLocalPrompt] = useState('');
  const [localLlmModel, setLocalLlmModel] = useState('claude-3-5-sonnet-20241022');

  // Update local state when data loads
  useEffect(() => {
    if (agentPrompt) {
      setLocalPrompt(agentPrompt.knowledge_base || '');
      setLocalLlmModel(agentPrompt.llm_model || 'claude-3-5-sonnet-20241022');
    }
  }, [agentPrompt]);

  const handleSave = async () => {
    if (!agentPrompt) return;

    setIsSaving(true);
    try {
      await updateAgentPrompt.mutateAsync({
        id: agentPrompt.id,
        knowledge_base: localPrompt,
        llm_model: localLlmModel,
        category: agentPrompt.category,
        name: agentPrompt.name,
        description: agentPrompt.description,
        agent_type: agentPrompt.agent_type,
      });
      
      toast.success('Prompt salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar o prompt');
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Agente: {category}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {agentPrompt?.description || 'Configure o prompt principal do agente'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={agentPrompt?.is_active ? 'default' : 'secondary'}>
            {agentPrompt?.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Prompt'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="prompt" className="w-full">
        <TabsList>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Prompt Principal
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Testar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="mt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Prompt Principal do Agente
              </label>
              <p className="text-sm text-muted-foreground mb-3">
                Este é o prompt único que define todo o comportamento do agente. 
                Não há mais steps - tudo acontece em uma única interação.
              </p>
              <Textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder={`Exemplo para agente de ${category}:

Você é um assistente especializado em ${category}.

**Suas responsabilidades:**
- Responder perguntas sobre produtos de ${category}
- Qualificar leads coletando informações importantes
- Fornecer orçamentos quando possível
- Transferir para humano quando necessário

**Informações sobre ${category}:**
[Adicione aqui informações específicas do produto/serviço]

**Como se comportar:**
- Sempre seja amigável e profissional
- Faça perguntas para entender melhor as necessidades
- Use as variáveis disponíveis como {{customer_name}}, {{energy_bill_value}}, etc.
- Quando tiver informações suficientes, ofereça um orçamento ou transferir para especialista

**Exemplo de conversa:**
Cliente: {{message}}
Contexto: Nome = {{customer_name}}, Lead Score = {{lead_score}}

Resposta: [sua resposta aqui baseada no contexto]`}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Use variáveis como: {`{{customer_name}}`}, {`{{energy_bill_value}}`}, {`{{lead_score}}`}, {`{{current_date}}`}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Modelo LLM
              </label>
              <select
                value={localLlmModel}
                onChange={(e) => setLocalLlmModel(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="grok-beta">Grok Beta</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Categoria</p>
                <p className="text-sm text-muted-foreground">{category}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Tipo</p>
                <p className="text-sm text-muted-foreground">Especialista</p>
              </div>
            </div>
          </div>
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