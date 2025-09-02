import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageCircle, 
  Users, 
  Clock, 
  Target 
} from 'lucide-react';
import { useConversationAnalytics } from '@/hooks/useConversationAnalytics';
import { useVendorPerformance } from '@/hooks/useVendorPerformance';
import { useLeadAnalytics } from '@/hooks/useLeadAnalytics';

interface AnalyticsOverviewProps {
  period: string;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  hot: 'hsl(var(--lead-hot))',
  warm: 'hsl(var(--lead-warm))',
  cold: 'hsl(var(--lead-cold))'
};

export function AnalyticsOverview({ period }: AnalyticsOverviewProps) {
  const { data: conversationData, isLoading: conversationLoading } = useConversationAnalytics(period);
  const { data: vendorData, isLoading: vendorLoading } = useVendorPerformance(period);
  const { data: leadData, isLoading: leadLoading } = useLeadAnalytics(period);

  if (conversationLoading || vendorLoading || leadLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total de Conversas',
      value: conversationData?.totalConversations || 0,
      icon: MessageCircle,
      color: 'text-primary'
    },
    {
      title: 'Vendedores Ativos',
      value: vendorData?.totalVendors || 0,
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Leads Quentes',
      value: leadData?.hotLeads || 0,
      icon: Target,
      color: 'text-lead-hot'
    },
    {
      title: 'Taxa de Conversão',
      value: `${leadData?.overallConversionRate || 0}%`,
      icon: Target,
      color: 'text-primary'
    }
  ];

  const temperatureData = leadData?.temperatureDistribution.map(item => ({
    name: item.temperature === 'hot' ? 'Quente' : item.temperature === 'warm' ? 'Morno' : 'Frio',
    value: item.count,
    color: item.temperature === 'hot' ? COLORS.hot : 
           item.temperature === 'warm' ? COLORS.warm : COLORS.cold
  })) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversas Diárias */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Conversas Diárias</CardTitle>
            <CardDescription>
              Evolução do número de conversas ao longo do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversationData?.dailyConversations || []}>
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
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Leads */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Distribuição de Leads</CardTitle>
            <CardDescription>
              Proporção de leads por temperatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={temperatureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Timeline */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Tempo de Resposta</CardTitle>
          <CardDescription>
            Evolução do tempo médio de resposta dos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendorData?.performanceComparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}min`, 'Tempo de Resposta']}
              />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Performers</CardTitle>
          <CardDescription>
            Vendedores com melhor performance no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendorData?.topPerformers.slice(0, 5).map((vendor, index) => (
              <div key={vendor.vendorId} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground">{vendor.vendorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.totalConversations} conversas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {vendor.qualityScore}/10
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {vendor.avgResponseTime}min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}