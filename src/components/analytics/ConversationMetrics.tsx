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
  LineChart,
  Line
} from 'recharts';
import { MessageCircle, Bot, User, Clock } from 'lucide-react';
import { useConversationAnalytics } from '@/hooks/useConversationAnalytics';

interface ConversationMetricsProps {
  period: string;
}

const STATUS_COLORS = {
  active: 'hsl(var(--primary))',
  waiting: 'hsl(var(--lead-warm))',
  completed: 'hsl(var(--lead-cold))',
  bot: 'hsl(var(--accent))'
};

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--lead-hot))',
  'hsl(var(--lead-warm))',
  'hsl(var(--lead-cold))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))'
];

export function ConversationMetrics({ period }: ConversationMetricsProps) {
  const { data, isLoading } = useConversationAnalytics(period);

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

  const statusChartData = data.statusDistribution.map(item => ({
    ...item,
    fill: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active
  }));

  const categoryChartData = data.categoryDistribution.map((item, index) => ({
    ...item,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Conversas
            </CardTitle>
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeConversations} ativas, {data.completedConversations} finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Mensagens
            </CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.avgMessagesPerConversation}</div>
            <p className="text-xs text-muted-foreground">
              Por conversa
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <User className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Bot → Vendedor
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.responseTimeData.length > 0 
                ? Math.round(data.responseTimeData.reduce((sum, item) => sum + item.avgMinutes, 0) / data.responseTimeData.length * 10) / 10
                : 0
              }min
            </div>
            <p className="text-xs text-muted-foreground">
              De resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Conversations */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Conversas por Dia</CardTitle>
            <CardDescription>
              Distribuição de conversas ao longo do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyConversations}>
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
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Tempo de Resposta</CardTitle>
            <CardDescription>
              Evolução do tempo médio de resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.responseTimeData}>
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
                  formatter={(value: number) => [`${value.toFixed(1)}min`, 'Tempo Médio']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgMinutes" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Status das Conversas</CardTitle>
            <CardDescription>
              Distribuição por status atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="count"
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Categorias de Produto</CardTitle>
            <CardDescription>
              Distribuição por categoria de interesse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="category"
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Detalhamento por Status</CardTitle>
          <CardDescription>
            Análise detalhada de cada status de conversa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.statusDistribution.map((status) => (
              <div key={status.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="capitalize"
                      style={{ 
                        backgroundColor: STATUS_COLORS[status.status as keyof typeof STATUS_COLORS] + '20',
                        color: STATUS_COLORS[status.status as keyof typeof STATUS_COLORS]
                      }}
                    >
                      {status.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {status.count} conversas
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {status.percentage}%
                  </span>
                </div>
                <Progress 
                  value={status.percentage} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}