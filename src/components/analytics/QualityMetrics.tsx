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
import { useVendorQuality } from '@/hooks/useVendorQuality';
import { useVendors } from '@/hooks/useVendors';

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
  
  // Simular dados de qualidade agregados
  const mockQualityData = {
    avgResponseTime: 3.2,
    avgQualityScore: 7.8,
    avgSatisfactionRate: 85,
    totalAlerts: 3,
    resolvedIssues: 12,
    responseTimeDistribution: [
      { range: '0-2min', count: 45, percentage: 35 },
      { range: '2-5min', count: 52, percentage: 40 },
      { range: '5-10min', count: 23, percentage: 18 },
      { range: '10min+', count: 9, percentage: 7 }
    ],
    qualityTrend: [
      { period: '1', responseTime: 3.5, quality: 7.2, satisfaction: 82 },
      { period: '2', responseTime: 3.8, quality: 7.5, satisfaction: 84 },
      { period: '3', responseTime: 3.2, quality: 7.8, satisfaction: 85 },
      { period: '4', responseTime: 3.0, quality: 8.1, satisfaction: 87 },
      { period: '5', responseTime: 2.8, quality: 8.3, satisfaction: 89 },
      { period: '6', responseTime: 3.2, quality: 7.8, satisfaction: 85 },
      { period: '7', responseTime: 3.2, quality: 7.8, satisfaction: 85 }
    ],
    alerts: [
      { vendor: 'João Silva', issue: 'Tempo de resposta alto', severity: 'medium' },
      { vendor: 'Maria Santos', issue: 'Score de qualidade baixo', severity: 'high' },
      { vendor: 'Pedro Costa', issue: 'Taxa de resolução baixa', severity: 'low' }
    ]
  };

  if (vendorsLoading) {
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

  const responseTimeQuality = getResponseTimeLevel(mockQualityData.avgResponseTime);
  const qualityScoreLevel = getQualityLevel(mockQualityData.avgQualityScore);

  // Dados para gráfico radial
  const radialData = [
    {
      name: 'Qualidade',
      value: mockQualityData.avgQualityScore * 10,
      fill: qualityScoreLevel.color
    },
    {
      name: 'Satisfação',
      value: mockQualityData.avgSatisfactionRate,
      fill: QUALITY_COLORS.good
    }
  ];

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
              {mockQualityData.avgResponseTime}min
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
              {mockQualityData.avgQualityScore}/10
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
              Taxa de Satisfação
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mockQualityData.avgSatisfactionRate}%
            </div>
            <Progress 
              value={mockQualityData.avgSatisfactionRate} 
              className="h-2 mt-2"
            />
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
              {mockQualityData.totalAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockQualityData.resolvedIssues} resolvidos este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {mockQualityData.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">Alertas de Qualidade</h3>
          {mockQualityData.alerts.map((alert, index) => (
            <Alert key={index} className="border-border">
              <AlertTriangle className={`w-4 h-4 ${
                alert.severity === 'high' ? 'text-destructive' :
                alert.severity === 'medium' ? 'text-lead-warm' : 'text-muted-foreground'
              }`} />
              <AlertDescription>
                <span className="font-medium">{alert.vendor}:</span> {alert.issue}
                <Badge 
                  variant="secondary" 
                  className={`ml-2 ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {alert.severity === 'high' ? 'Alta' : 
                   alert.severity === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

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
              <LineChart data={mockQualityData.qualityTrend}>
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
                  name="Qualidade"
                />
                <Line 
                  type="monotone" 
                  dataKey="satisfaction" 
                  stroke={QUALITY_COLORS.excellent}
                  strokeWidth={2}
                  name="Satisfação (%)"
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
              {mockQualityData.responseTimeDistribution.map((range, index) => (
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
              <BarChart data={mockQualityData.responseTimeDistribution}>
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
                  const quality = Number((Math.random() * 3 + 7).toFixed(1)); // 7-10
                  const responseTime = Number((Math.random() * 4 + 1).toFixed(1)); // 1-5 min
              const qualityLevel = getQualityLevel(quality);
              const timeLevel = getResponseTimeLevel(responseTime);
              
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
                      <span className="text-sm text-muted-foreground">Qualidade</span>
                      <span className="text-sm font-medium">{quality.toFixed(1)}/10</span>
                    </div>
                    <Progress value={quality * 10} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tempo Resp.</span>
                      <span className="text-sm font-medium">{responseTime.toFixed(1)}min</span>
                    </div>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: timeLevel.color + '20', color: timeLevel.color }}
                    >
                      {timeLevel.label}
                    </Badge>
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