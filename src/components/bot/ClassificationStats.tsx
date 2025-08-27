import { Target, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { useClassificationStats } from '@/hooks/useClassificationLogs';

export function ClassificationStats() {
  const { data: stats } = useClassificationStats();

  const statCards = [
    {
      title: 'Taxa de Acerto',
      value: `${stats?.accuracyRate || 0}%`,
      icon: Target,
      iconColor: 'text-purple-600',
      trend: '+5%',
      trendColor: 'text-green-600'
    },
    {
      title: 'Não Classificados Hoje',
      value: stats?.unclassified || 0,
      icon: AlertCircle,
      iconColor: 'text-orange-600',
      trend: `${stats?.unclassified || 0}`,
      trendColor: 'text-red-600'
    },
    {
      title: 'Tempo Médio',
      value: `${stats?.averageTime?.toFixed(1) || '0.0'}s`,
      icon: Zap,
      iconColor: 'text-yellow-600',
      trend: 'ms',
      trendColor: 'text-muted-foreground'
    },
    {
      title: 'Classificações Hoje',
      value: stats?.totalClassifications || 0,
      icon: TrendingUp,
      iconColor: 'text-green-600',
      trend: '+12%',
      trendColor: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mt-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            <span className={`text-xs font-medium ${stat.trendColor}`}>
              {stat.trend}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.title}</p>
        </div>
      ))}
    </div>
  );
}