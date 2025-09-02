import { useState } from 'react';
import { TrendingUp, Clock, MessageSquare, Target, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVendorQuality } from '@/hooks/useVendorQuality';
import { useVendorQualityAnalysis } from '@/hooks/useVendorQualityAnalysis';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VendorQualityProps {
  vendor: any;
}

export function VendorQuality({ vendor }: VendorQualityProps) {
  const [period, setPeriod] = useState('7'); // 7 dias
  const { data: qualityData, isLoading } = useVendorQuality(vendor.id, period);
  const { triggerBatchAnalysis, isBatchAnalyzing } = useVendorQualityAnalysis();

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
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerBatchAnalysis({ vendorId: vendor.id })}
            disabled={isBatchAnalyzing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isBatchAnalyzing ? 'animate-spin' : ''}`} />
            {isBatchAnalyzing ? 'Analisando...' : 'Analisar Qualidade'}
          </Button>
          
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
                  <div key={conv.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{conv.customer_name || 'Cliente'}</p>
                        <p className="text-sm text-muted-foreground">{conv.customer_phone}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={conv.response_time <= 5 ? 'default' : conv.response_time <= 15 ? 'secondary' : 'destructive'}>
                          {conv.response_time}min
                        </Badge>
                        {conv.quality_score > 0 && (
                          <Badge variant="outline" className="ml-2">
                            Score: {conv.quality_score}/10
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {conv.analysis_data && (
                      <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
                        <p><strong>Análise da IA:</strong></p>
                        {conv.criteria_scores && (
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {Object.entries(conv.criteria_scores).map(([key, value]: [string, any]) => (
                              <p key={key}>
                                {key.replace(/_/g, ' ')}: {value}/10
                              </p>
                            ))}
                          </div>
                        )}
                        {conv.recommendations && conv.recommendations.length > 0 && (
                          <div className="mt-2">
                            <p><strong>Recomendações:</strong></p>
                            <ul className="list-disc list-inside mt-1">
                              {conv.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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
              <CardTitle className="flex items-center gap-2">
                Alertas de Qualidade
                {qualityData?.hasAiAnalysis && (
                  <Badge variant="secondary" className="text-xs">
                    IA Ativa
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qualityData?.alerts?.length > 0 ? (
                  qualityData.alerts.map((alert: any) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {alert.type === 'critical' ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{alert.title}</p>
                          <Badge 
                            variant={alert.resolved ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {alert.resolved ? "Resolvido" : alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        
                        {alert.metadata && (
                          <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
                            {alert.metadata.conversation_id && (
                              <p>Conversa: {alert.metadata.conversation_id}</p>
                            )}
                            {alert.metadata.criteria && (
                              <p>Critério: {alert.metadata.criteria}</p>
                            )}
                            {alert.metadata.score && (
                              <p>Score: {alert.metadata.score}/10</p>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                    <p>Nenhum alerta de qualidade</p>
                    <p className="text-sm">
                      {qualityData?.hasAiAnalysis 
                        ? "Parabéns! O agente de IA não detectou problemas no atendimento."
                        : "Configure o agente de qualidade na página Bot para monitoramento automático."
                      }
                    </p>
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