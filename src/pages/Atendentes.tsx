import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AtendenteList } from '@/components/atendentes/AtendenteList';
import { AddAtendenteDialog } from '@/components/atendentes/AddAtendenteDialog';
import { useAtendentes, type Atendente } from '@/hooks/useAtendentes';
import { Users, UserPlus, TrendingUp, Clock, Star } from 'lucide-react';

export default function AtendentesPage() {
  const [selectedAtendente, setSelectedAtendente] = useState<Atendente | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('atendentes');
  const { atendentes, isLoading } = useAtendentes();

  const handleSelectAtendente = (atendente: Atendente) => {
    setSelectedAtendente(atendente);
    setActiveTab('detalhes');
  };

  const stats = {
    total: atendentes.length,
    active: atendentes.filter(a => a.is_active).length,
    avgResponseTime: 0, // TODO: Calcular quando tivermos dados
    avgQualityScore: 0, // TODO: Calcular quando tivermos dados
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atendentes</h1>
          <p className="text-muted-foreground">
            Gerencie sua equipe de atendimento e acompanhe a performance
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Convidar Atendente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">atendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">online agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}min</div>
            <p className="text-xs text-muted-foreground">resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualidade</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgQualityScore}%</div>
            <p className="text-xs text-muted-foreground">média geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="atendentes">Atendentes</TabsTrigger>
          {selectedAtendente && (
            <TabsTrigger value="detalhes">
              Detalhes - {selectedAtendente.display_name}
            </TabsTrigger>
          )}
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="atendentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Atendentes</CardTitle>
              <CardDescription>
                Gerencie perfis, permissões e status da sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AtendenteList
                onSelectAtendente={handleSelectAtendente}
                selectedAtendente={selectedAtendente}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {selectedAtendente && (
          <TabsContent value="detalhes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Atendente</CardTitle>
                <CardDescription>
                  Informações detalhadas e histórico de {selectedAtendente.display_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                    <div className="space-y-2">
                      <p><strong>Nome:</strong> {selectedAtendente.display_name}</p>
                      <p><strong>Email:</strong> {selectedAtendente.email}</p>
                      <p><strong>Telefone:</strong> {selectedAtendente.phone || 'Não informado'}</p>
                      <p><strong>Departamento:</strong> {selectedAtendente.department || 'Não informado'}</p>
                      <p><strong>Cargo:</strong> {selectedAtendente.role}</p>
                      <p><strong>Status:</strong> {selectedAtendente.is_active ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Estatísticas</h3>
                    <div className="space-y-2">
                      <p><strong>Conversas Atendidas:</strong> {selectedAtendente.stats?.total_conversations || 0}</p>
                      <p><strong>Tempo Médio de Resposta:</strong> {selectedAtendente.stats?.avg_response_time || 0} min</p>
                      <p><strong>Score de Qualidade:</strong> {selectedAtendente.stats?.quality_score || 0}%</p>
                      <p><strong>Data de Cadastro:</strong> {new Date(selectedAtendente.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {/* TODO: Adicionar gráficos de performance, histórico de conversas, etc. */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📊 Métricas detalhadas e histórico de conversas serão implementadas quando 
                    o sistema de atribuição de conversas estiver configurado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance da Equipe</CardTitle>
              <CardDescription>
                Análise geral de performance e produtividade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Dashboard em Desenvolvimento</h3>
                <p className="text-sm text-muted-foreground">
                  Relatórios de performance, gráficos de produtividade e métricas 
                  detalhadas serão implementados em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Atendente Dialog */}
      <AddAtendenteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          // Refresh data
          window.location.reload();
        }}
      />
    </div>
  );
}