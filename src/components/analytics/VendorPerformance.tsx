import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter
} from 'recharts';
import { Users, Clock, Star, TrendingUp, Trophy, AlertCircle } from 'lucide-react';
import { useVendorPerformance } from '@/hooks/useVendorPerformance';

interface VendorPerformanceProps {
  period: string;
}

const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case 'excellent': return 'text-green-600 bg-green-50';
    case 'good': return 'text-blue-600 bg-blue-50';
    case 'average': return 'text-yellow-600 bg-yellow-50';
    case 'poor': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getPerformanceLabel = (performance: string) => {
  switch (performance) {
    case 'excellent': return 'Excelente';
    case 'good': return 'Bom';
    case 'average': return 'Médio';
    case 'poor': return 'Baixo';
    default: return 'N/A';
  }
};

export function VendorPerformance({ period }: VendorPerformanceProps) {
  const { data, isLoading } = useVendorPerformance(period);

  if (isLoading) {
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

  if (!data) return null;

  // Dados para gráfico de scatter (Quality vs Response Time)
  const scatterData = data.vendors.map(vendor => ({
    x: vendor.avgResponseTime,
    y: vendor.qualityScore,
    name: vendor.vendorName,
    conversations: vendor.totalConversations
  }));

  // Dados para ranking
  const vendorRanking = [...data.vendors]
    .sort((a, b) => {
      // Score composto considerando todos os fatores
      const scoreA = (a.qualityScore * 0.4) + ((10 - a.avgResponseTime) * 0.3) + (a.conversionRate * 0.3);
      const scoreB = (b.qualityScore * 0.4) + ((10 - b.avgResponseTime) * 0.3) + (b.conversionRate * 0.3);
      return scoreB - scoreA;
    });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendedores Ativos
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              {data.vendors.filter(v => v.performance === 'excellent').length} com performance excelente
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio Resposta
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.avgResponseTime}min</div>
            <p className="text-xs text-muted-foreground">
              Meta: &lt; 3min
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score Médio Qualidade
            </CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.avgQualityScore}/10</div>
            <p className="text-xs text-muted-foreground">
              Meta: &gt; 8.0
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversas
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.vendors.reduce((sum, v) => sum + v.totalConversations, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.vendors.reduce((sum, v) => sum + v.activeConversations, 0)} ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Evolução da Performance</CardTitle>
            <CardDescription>
              Métricas agregadas dos vendedores ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.performanceComparison}>
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
                  dataKey="responseTime" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Tempo Resposta (min)"
                />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="hsl(var(--lead-hot))"
                  strokeWidth={2}
                  name="Qualidade"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Qualidade vs Tempo de Resposta</CardTitle>
            <CardDescription>
              Correlação entre qualidade e velocidade de resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={scatterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="x" 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Tempo Resposta (min)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  dataKey="y"
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Qualidade', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    name === 'x' ? `${value}min` : value,
                    name === 'x' ? 'Tempo Resposta' : 'Qualidade'
                  ]}
                  labelFormatter={(label, payload) => 
                    payload?.[0]?.payload?.name || 'Vendedor'
                  }
                />
                <Scatter 
                  dataKey="y" 
                  fill="hsl(var(--primary))"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-foreground">Top Performers</CardTitle>
            <CardDescription>
              Vendedores com melhor performance geral
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.topPerformers.slice(0, 3).map((vendor, index) => (
              <div key={vendor.vendorId} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <Badge className={getPerformanceColor(vendor.performance)}>
                    {getPerformanceLabel(vendor.performance)}
                  </Badge>
                </div>
                <h4 className="font-medium text-foreground mb-1">{vendor.vendorName}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Conversas:</span>
                    <span>{vendor.totalConversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qualidade:</span>
                    <span>{vendor.qualityScore}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo Resp:</span>
                    <span>{vendor.avgResponseTime}min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Ranking Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Ranking Completo</CardTitle>
          <CardDescription>
            Performance detalhada de todos os vendedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Conversas</TableHead>
                <TableHead>Tempo Resp.</TableHead>
                <TableHead>Qualidade</TableHead>
                <TableHead>Taxa Conv.</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorRanking.map((vendor, index) => (
                <TableRow key={vendor.vendorId}>
                  <TableCell>
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{vendor.totalConversations}</span>
                      <span className="text-xs text-muted-foreground">
                        {vendor.activeConversations} ativas
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{vendor.avgResponseTime}min</span>
                      {vendor.avgResponseTime > 5 && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{vendor.qualityScore}/10</span>
                      <Progress 
                        value={vendor.qualityScore * 10} 
                        className="w-16 h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>{vendor.conversionRate}%</TableCell>
                  <TableCell>
                    <Badge className={getPerformanceColor(vendor.performance)}>
                      {getPerformanceLabel(vendor.performance)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}