import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Plus, Settings, Zap, Users, Search, Edit, Trash2 } from 'lucide-react';
import { useAgentConfigs, useCreateAgentConfig, useUpdateAgentConfig, useDeleteAgentConfig, AgentConfig } from '@/hooks/useAgentConfigs';
import { useToast } from '@/hooks/use-toast';
import { ProductCategory } from '@/types/conversation.types';

const agentTypeLabels = {
  general: 'Geral',
  classifier: 'Classificador',
  extractor: 'Extrator',
  specialist: 'Especialista',
  lead_scorer: 'Avaliador de Leads'
};

const agentTypeIcons = {
  general: Users,
  classifier: Search,
  extractor: Zap,
  specialist: Bot,
  lead_scorer: Users
};

const productCategories: ProductCategory[] = [
  'energia_solar',
  'telha_shingle', 
  'steel_frame',
  'drywall_divisorias',
  'ferramentas',
  'pisos',
  'acabamentos',
  'forros'
];

interface AgentFormData {
  agent_name: string;
  agent_type: 'general' | 'classifier' | 'extractor' | 'specialist' | 'lead_scorer';
  product_category?: ProductCategory;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  description?: string;
  is_spy: boolean;
}

export function AgentConfigurationSection() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: agents, isLoading } = useAgentConfigs();
  const createAgent = useCreateAgentConfig();
  const updateAgent = useUpdateAgentConfig();
  const deleteAgent = useDeleteAgentConfig();
  const { toast } = useToast();

  const [formData, setFormData] = useState<AgentFormData>({
    agent_name: '',
    agent_type: 'specialist',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 300,
    is_active: true,
    is_spy: false
  });

  const resetForm = () => {
    setFormData({
      agent_name: '',
      agent_type: 'specialist',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 300,
      is_active: true,
      is_spy: false
    });
    setEditingAgent(null);
  };

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setFormData({
      agent_name: agent.agent_name,
      agent_type: agent.agent_type,
      product_category: agent.product_category,
      system_prompt: agent.system_prompt,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      is_active: agent.is_active,
      description: agent.description,
      is_spy: agent.is_spy
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAgent) {
        await updateAgent.mutateAsync({
          id: editingAgent.id,
          ...formData
        });
        toast({
          title: "Agente atualizado",
          description: "Configurações do agente foram atualizadas com sucesso.",
        });
      } else {
        await createAgent.mutateAsync(formData);
        toast({
          title: "Agente criado",
          description: "Novo agente foi criado com sucesso.",
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar agente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (agent: AgentConfig) => {
    if (confirm(`Tem certeza que deseja excluir o agente "${agent.agent_name}"?`)) {
      try {
        await deleteAgent.mutateAsync(agent.id);
        toast({
          title: "Agente excluído",
          description: "Agente foi excluído com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir agente. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredAgents = agents?.filter(agent => {
    if (selectedTab === 'all') return true;
    return agent.agent_type === selectedTab;
  }) || [];

  if (isLoading) {
    return <div>Carregando agentes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Sistema de Agentes
            </CardTitle>
            <CardDescription>
              Configure agentes especializados para diferentes categorias de atendimento
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agent_name">Nome do Agente</Label>
                    <Input
                      id="agent_name"
                      value={formData.agent_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent_type">Tipo do Agente</Label>
                    <Select 
                      value={formData.agent_type} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, agent_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Geral</SelectItem>
                        <SelectItem value="classifier">Classificador</SelectItem>
                        <SelectItem value="extractor">Extrator</SelectItem>
                        <SelectItem value="specialist">Especialista</SelectItem>
                        <SelectItem value="lead_scorer">Avaliador de Leads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.agent_type === 'specialist' && (
                  <div>
                    <Label htmlFor="product_category">Categoria do Produto</Label>
                    <Select 
                      value={formData.product_category} 
                      onValueChange={(value: ProductCategory) => setFormData(prev => ({ ...prev, product_category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="system_prompt">Prompt do Sistema</Label>
                  <Textarea
                    id="system_prompt"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                    rows={8}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature">Temperatura</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_tokens">Max Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      min="50"
                      max="2000"
                      value={formData.max_tokens}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAgent.isPending || updateAgent.isPending}>
                    {editingAgent ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="classifier">Classificador</TabsTrigger>
            <TabsTrigger value="extractor">Extrator</TabsTrigger>
            <TabsTrigger value="specialist">Especialistas</TabsTrigger>
            <TabsTrigger value="lead_scorer">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid gap-4">
              {filteredAgents.map((agent) => {
                const IconComponent = agentTypeIcons[agent.agent_type];
                return (
                  <Card key={agent.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{agent.agent_name}</h3>
                          <p className="text-sm text-muted-foreground">{agent.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                          {agent.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline">
                          {agentTypeLabels[agent.agent_type]}
                        </Badge>
                        {agent.product_category && (
                          <Badge variant="outline">
                            {agent.product_category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(agent)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(agent)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p className="line-clamp-2">{agent.system_prompt}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}