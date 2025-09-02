import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Clock, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Activity,
  Users,
  MessageSquare
} from 'lucide-react';
import { useVendors } from '@/hooks/useVendors';
import { useRealQualityMetrics } from '@/hooks/useRealQualityMetrics';

interface QualityMetricsProps {
  period: string;
}

const QUALITY_COLORS = {
  excellent: 'hsl(var(--lead-hot))',
  good: 'hsl(var(--primary))',
  average: 'hsl(var(--lead-warm))',
  poor: 'hsl(var(--destructive))'
};

const getQualityLevel = (score: number) => {
  if (score >= 9) return { level: 'excellent', label: 'Excelente', color: QUALITY_COLORS.excellent };
  if (score >= 7) return { level: 'good', label: 'Bom', color: QUALITY_COLORS.good };
  if (score >= 5) return { level: 'average', label: 'Médio', color: QUALITY_COLORS.average };
  return { level: 'poor', label: 'Baixo', color: QUALITY_COLORS.poor };
};

const getResponseTimeLevel = (minutes: number) => {
  if (minutes <= 2) return { level: 'excellent', label: 'Excelente', color: QUALITY_COLORS.excellent };
  if (minutes <= 5) return { level: 'good', label: 'Bom', color: QUALITY_COLORS.good };
  if (minutes <= 10) return { level: 'average', label: 'Médio', color: QUALITY_COLORS.average };
  return { level: 'poor', label: 'Baixo', color: QUALITY_COLORS.poor };
};

export function QualityMetrics({ period }: QualityMetricsProps) {
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  const { data: qualityData, isLoading: qualityLoading } = useRealQualityMetrics(period);

  if (vendorsLoading || qualityLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!qualityData?.hasData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Dados de Qualidade Não Disponíveis
          </h3>
          <p className="text-muted-foreground">
            Não há métricas de qualidade registradas para o período selecionado.
          </p>
        </div>
      </div>
    );
  }

  const responseTimeQuality = qualityData.avgResponseTime 
    ? getResponseTimeLevel(qualityData.avgResponseTime)
    : { level: 'poor', label: 'N/A', color: QUALITY_COLORS.poor };
    
  const qualityScoreLevel = qualityData.avgQualityScore 
    ? getQualityLevel(qualityData.avgQualityScore)
    : { level: 'poor', label: 'N/A', color: QUALITY_COLORS.poor };

  // Dados para gráfico radial
  const radialData = qualityData.avgQualityScore ? [
    {
      name: 'Qualidade',
      value: qualityData.avgQualityScore * 10,
      fill: qualityScoreLevel.color
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio Resposta
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {qualityData.avgResponseTime ? `${qualityData.avgResponseTime}min` : 'N/A'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary"
                style={{ backgroundColor: responseTimeQuality.color + '20', color: responseTimeQuality.color }}
              >
                {responseTimeQuality.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score de Qualidade
            </CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {qualityData.avgQualityScore ? `${qualityData.avgQualityScore}/10` : 'N/A'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary"
                style={{ backgroundColor: qualityScoreLevel.color + '20', color: qualityScoreLevel.color }}
              >
                {qualityScoreLevel.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversas Analisadas
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {qualityData.responseTimeDistribution.reduce((sum, range) => sum + range.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Conversas com métricas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Ativos
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {qualityData.totalAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              Nenhum alerta ativo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {qualityData.totalAlerts > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">Alertas de Qualidade</h3>
          <Alert className="border-border">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              Nenhum alerta de qualidade no momento. Todas as métricas estão dentro dos parâmetros esperados.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Trends */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Evolução da Qualidade</CardTitle>
            <CardDescription>
              Tendências de qualidade, tempo de resposta e satisfação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={qualityData.qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke={QUALITY_COLORS.good}
                  strokeWidth={2}
                  name="Score de Qualidade"
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke={QUALITY_COLORS.average}
                  strokeWidth={2}
                  name="Tempo de Resposta (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Radial */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Geral</CardTitle>
            <CardDescription>
              Indicadores principais de qualidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={radialData}>
                <RadialBar dataKey="value" cornerRadius={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'Qualidade' ? `${(Number(value) / 10).toFixed(1)}/10` : `${Number(value)}%`,
                    name
                  ]}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Distribution */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Distribuição de Tempo de Resposta</CardTitle>
          <CardDescription>
            Análise detalhada dos tempos de resposta dos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {qualityData.responseTimeDistribution.map((range, index) => (
                <div key={range.range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{range.range}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{range.count} conversas</span>
                      <Badge variant="secondary">{range.percentage}%</Badge>
                    </div>
                  </div>
                  <Progress 
                    value={range.percentage} 
                    className="h-3"
                  />
                </div>
              ))}
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={qualityData.responseTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Quality Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Resumo de Qualidade por Vendedor</CardTitle>
          <CardDescription>
            Performance individual dos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors?.slice(0, 6).map((vendor) => {
              const hasStats = vendor.stats && Object.keys(vendor.stats).length > 0;
              
              return (
                <div key={vendor.id} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{vendor.name}</h4>
                    <Badge 
                      variant="secondary"
                      className={vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {vendor.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Conversas</span>
                      <span className="text-sm font-medium">
                        {hasStats ? vendor.stats.total_conversations : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Qualidade</span>
                      <span className="text-sm font-medium">
                        {hasStats && vendor.stats.quality_score 
                          ? `${vendor.stats.quality_score.toFixed(1)}/10` 
                          : 'Sem dados'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}