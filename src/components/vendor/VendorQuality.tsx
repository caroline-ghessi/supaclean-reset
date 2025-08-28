import { useState } from 'react';
import { TrendingUp, Clock, MessageSquare, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVendorQuality } from '@/hooks/useVendorQuality';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VendorQualityProps {
  vendor: any;
}

export function VendorQuality({ vendor }: VendorQualityProps) {
  const [period, setPeriod] = useState('7'); // 7 dias
  const { data: qualityData, isLoading } = useVendorQuality(vendor.id, period);

  const getResponseTimeColor = (minutes: number) => {
    if (minutes <= 5) return 'text-green-600';
    if (minutes <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Qualidade</h2>
          <p className="text-muted-foreground">
            Métricas de atendimento de {vendor.name}
          </p>
        </div>
        
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Hoje</SelectItem>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getResponseTimeColor(qualityData?.avgResponseTime || 0)}`}>
              {qualityData?.avgResponseTime || 0} min
            </div>
            <div className="flex items-center mt-1">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Meta: ≤ 5 min
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getQualityScoreColor(qualityData?.qualityScore || 0)}`}>
              {(qualityData?.qualityScore || 0).toFixed(1)}
            </div>
            <div className="flex items-center mt-1">
              <Target className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Meta: ≥ 8.0
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversas Atendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {qualityData?.totalConversations || 0}
            </div>
            <div className="flex items-center mt-1">
              <MessageSquare className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {qualityData?.activeConversations || 0} ativas
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Satisfação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(qualityData?.satisfactionRate || 0).toFixed(1)}%
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Baseado em análises
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Gráfico de performance seria aqui */}
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Últimos {period} Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Gráfico de performance será implementado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qualityData?.recentConversations?.map((conv: any) => (
                  <div key={conv.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{conv.customer_name || 'Cliente'}</p>
                      <p className="text-sm text-muted-foreground">{conv.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={conv.response_time <= 5 ? 'default' : conv.response_time <= 15 ? 'secondary' : 'destructive'}>
                        {conv.response_time}min
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conversa no período selecionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Qualidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qualityData?.alerts?.length > 0 ? (
                  qualityData.alerts.map((alert: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {alert.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                    <p>Nenhum alerta de qualidade</p>
                    <p className="text-sm">Parabéns! O atendimento está dentro dos padrões.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}