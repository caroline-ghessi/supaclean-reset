import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Shield, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { useQualityMonitorAgentManager } from "@/hooks/useQualityMonitorAgent";
import { KnowledgeBaseManager } from "./KnowledgeBaseManager";

export function QualityMonitorAgentSection() {
  const {
    agent,
    localConfig,
    isLoading,
    isEditing,
    isSaving,
    startEditing,
    cancelEditing,
    saveChanges,
    updateLocalConfig,
  } = useQualityMonitorAgentManager();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Monitor de Qualidade</CardTitle>
              <CardDescription>
                Agente de IA responsável por monitorar a qualidade do atendimento dos vendedores
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {agent && (
              <Badge variant={agent.is_active ? "default" : "secondary"}>
                {agent.is_active ? "Ativo" : "Inativo"}
              </Badge>
            )}
            {!isEditing ? (
              <Button onClick={startEditing} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  onClick={saveChanges} 
                  size="sm" 
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
                <Button 
                  onClick={cancelEditing} 
                  variant="outline" 
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Configuração */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="prompt">Prompt do Sistema</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_name">Nome do Agente</Label>
                  <Input
                    id="agent_name"
                    value={localConfig.agent_name}
                    onChange={(e) => updateLocalConfig({ agent_name: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Monitor de Qualidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="llm_model">Modelo LLM</Label>
                  <Select
                    value={localConfig.llm_model}
                    onValueChange={(value) => updateLocalConfig({ llm_model: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4O</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4O Mini</SelectItem>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={localConfig.description || ''}
                  onChange={(e) => updateLocalConfig({ description: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Descrição do agente..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperatura: {localConfig.temperature}</Label>
                  <Slider
                    value={[localConfig.temperature]}
                    onValueChange={([value]) => updateLocalConfig({ temperature: value })}
                    disabled={!isEditing}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla a criatividade. Menor = mais conservador
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Máximo de Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={localConfig.max_tokens}
                    onChange={(e) => updateLocalConfig({ max_tokens: parseInt(e.target.value) })}
                    disabled={!isEditing}
                    min={100}
                    max={4000}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={localConfig.is_active}
                  onCheckedChange={(checked) => updateLocalConfig({ is_active: checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="is_active">Agente Ativo</Label>
              </div>
            </CardContent>
          </Card>

          {/* Critérios de Qualidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Critérios de Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Tempo de Resposta</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Profissionalismo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Clareza</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="font-medium">Proatividade</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Capacidade de Resolução</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Follow-up</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Prompt do Sistema
              </CardTitle>
              <CardDescription>
                Configure as instruções que o agente seguirá para analisar a qualidade do atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={localConfig.system_prompt}
                  onChange={(e) => updateLocalConfig({ system_prompt: e.target.value })}
                  disabled={!isEditing}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Prompt do sistema..."
                />
                {!isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Clique em "Editar" para modificar o prompt do sistema
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Base de Conhecimento</CardTitle>
              <CardDescription>
                Gerencie os arquivos de conhecimento específicos para o agente de qualidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeBaseManager agentCategory="geral" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status do Agente */}
      {agent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status do Agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {agent.is_active ? <CheckCircle className="h-6 w-6 mx-auto" /> : <AlertTriangle className="h-6 w-6 mx-auto" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.is_active ? "Ativo" : "Inativo"}
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{agent.llm_model}</div>
                <p className="text-sm text-muted-foreground mt-1">Modelo LLM</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{agent.temperature}</div>
                <p className="text-sm text-muted-foreground mt-1">Temperatura</p>
              </div>
            </div>
            
            {agent.updated_at && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Última atualização: {new Date(agent.updated_at).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}