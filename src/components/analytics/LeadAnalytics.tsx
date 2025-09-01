import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { Flame, ThermometerSun, Snowflake, Target, TrendingUp } from 'lucide-react';
import { useLeadAnalytics } from '@/hooks/useLeadAnalytics';

interface LeadAnalyticsProps {
  period: string;
}

const TEMPERATURE_COLORS = {
  hot: 'hsl(var(--lead-hot))',
  warm: 'hsl(var(--lead-warm))',
  cold: 'hsl(var(--lead-cold))'
};

const TEMPERATURE_ICONS = {
  hot: Flame,
  warm: ThermometerSun,
  cold: Snowflake
};

export function LeadAnalytics({ period }: LeadAnalyticsProps) {
  const { data, isLoading } = useLeadAnalytics(period);

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

  const temperatureChartData = data.temperatureDistribution.map(item => ({
    ...item,
    name: item.temperature === 'hot' ? 'Quente' : 
          item.temperature === 'warm' ? 'Morno' : 'Frio',
    fill: TEMPERATURE_COLORS[item.temperature]
  }));

  const dailyAreaData = data.dailyLeads.map(day => ({
    ...day,
    total: day.hot + day.warm + day.cold
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Score médio: {data.avgLeadScore}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Quentes
            </CardTitle>
            <Flame className="w-4 h-4 text-lead-hot" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.hotLeads}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalLeads > 0 ? Math.round((data.hotLeads / data.totalLeads) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.overallConversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Leads → Vendedores
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Mornos
            </CardTitle>
            <ThermometerSun className="w-4 h-4 text-lead-warm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.warmLeads}</div>
            <p className="text-xs text-muted-foreground">
              Potencial de aquecimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.temperatureDistribution.map((temp) => {
          const Icon = TEMPERATURE_ICONS[temp.temperature];
          const colorClass = temp.temperature === 'hot' ? 'border-red-200 bg-red-50' :
                           temp.temperature === 'warm' ? 'border-orange-200 bg-orange-50' :
                           'border-blue-200 bg-blue-50';
          
          return (
            <Card key={temp.temperature} className={`border-border ${colorClass}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  Leads {temp.temperature === 'hot' ? 'Quentes' : 
                         temp.temperature === 'warm' ? 'Mornos' : 'Frios'}
                </CardTitle>
                <Icon className={`w-5 h-5`} style={{ color: TEMPERATURE_COLORS[temp.temperature] }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{temp.count}</div>
                <div className="space-y-2 mt-2">
                  <Progress 
                    value={temp.percentage} 
                    className="h-2"
                    style={{ 
                      backgroundColor: TEMPERATURE_COLORS[temp.temperature] + '20'
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{temp.percentage}% do total</span>
                    <span>Conv: {temp.conversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Leads Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Evolução Diária dos Leads</CardTitle>
            <CardDescription>
              Distribuição de leads por temperatura ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyAreaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
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
                <Area 
                  type="monotone" 
                  dataKey="hot" 
                  stackId="1"
                  stroke={TEMPERATURE_COLORS.hot}
                  fill={TEMPERATURE_COLORS.hot}
                  name="Quentes"
                />
                <Area 
                  type="monotone" 
                  dataKey="warm" 
                  stackId="1"
                  stroke={TEMPERATURE_COLORS.warm}
                  fill={TEMPERATURE_COLORS.warm}
                  name="Mornos"
                />
                <Area 
                  type="monotone" 
                  dataKey="cold" 
                  stackId="1"
                  stroke={TEMPERATURE_COLORS.cold}
                  fill={TEMPERATURE_COLORS.cold}
                  name="Frios"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Fontes de Leads</CardTitle>
            <CardDescription>
              Origem dos leads captados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.leadSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="count"
                  label={({ source, percentage }) => `${source}: ${percentage}%`}
                >
                  {data.leadSources.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? TEMPERATURE_COLORS.hot : 
                            index === 1 ? TEMPERATURE_COLORS.warm : 
                            TEMPERATURE_COLORS.cold} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Funil de Conversão</CardTitle>
          <CardDescription>
            Jornada dos leads desde a captação até a conversão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.conversionFunnel.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-foreground">{stage.stage}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">{stage.count}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({stage.conversionRate}%)
                    </span>
                  </div>
                </div>
                <Progress 
                  value={stage.conversionRate} 
                  className="h-3"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Performance por Categoria</CardTitle>
          <CardDescription>
            Análise de conversão por categoria de produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="category" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
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
                formatter={(value, name) => [
                  name === 'leads' ? `${value} leads` : 
                  name === 'conversions' ? `${value} conversões` :
                  `${value}%`,
                  name === 'leads' ? 'Total de Leads' :
                  name === 'conversions' ? 'Conversões' : 'Taxa de Conversão'
                ]}
              />
              <Bar dataKey="leads" fill={TEMPERATURE_COLORS.cold} name="leads" />
              <Bar dataKey="conversions" fill={TEMPERATURE_COLORS.hot} name="conversions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}