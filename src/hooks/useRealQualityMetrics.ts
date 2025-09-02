import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface QualityMetricsData {
  avgResponseTime: number | null;
  avgQualityScore: number | null;
  totalAlerts: number;
  hasData: boolean;
  responseTimeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  qualityTrend: {
    period: string;
    responseTime: number;
    quality: number;
  }[];
}

const getPeriodDates = (period: string) => {
  const now = new Date();
  let days: number;
  
  switch (period) {
    case 'today':
      days = 1;
      break;
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    case '90d':
      days = 90;
      break;
    default:
      days = 7;
  }
  
  return {
    startDate: subDays(now, days),
    endDate: now
  };
};

export function useRealQualityMetrics(period: string = '7d') {
  return useQuery({
    queryKey: ['real-quality-metrics', period],
    queryFn: async (): Promise<QualityMetricsData> => {
      const { startDate, endDate } = getPeriodDates(period);
      
      // Buscar métricas de qualidade
      const { data: qualityMetrics, error } = await supabase
        .from('quality_metrics')
        .select('*')
        .gte('metric_date', format(startDate, 'yyyy-MM-dd'))
        .lte('metric_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const hasData = qualityMetrics && qualityMetrics.length > 0;

      if (!hasData) {
        return {
          avgResponseTime: null,
          avgQualityScore: null,
          totalAlerts: 0,
          hasData: false,
          responseTimeDistribution: [],
          qualityTrend: []
        };
      }

      // Calcular métricas agregadas
      const avgResponseTime = qualityMetrics.reduce((sum, m) => 
        sum + (m.response_time_avg_minutes || 0), 0) / qualityMetrics.length;
      
      const avgQualityScore = qualityMetrics
        .filter(m => m.automated_quality_score !== null)
        .reduce((sum, m) => sum + (m.automated_quality_score || 0), 0) / 
        qualityMetrics.filter(m => m.automated_quality_score !== null).length || 0;

      // Distribuição de tempo de resposta
      const responseTimeRanges = [
        { range: '0-2min', min: 0, max: 2 },
        { range: '2-5min', min: 2, max: 5 },
        { range: '5-10min', min: 5, max: 10 },
        { range: '10min+', min: 10, max: Infinity }
      ];

      const responseTimeDistribution = responseTimeRanges.map(range => {
        const count = qualityMetrics.filter(m => {
          const time = m.response_time_avg_minutes || 0;
          return time >= range.min && time < range.max;
        }).length;
        
        const percentage = qualityMetrics.length > 0 
          ? Math.round((count / qualityMetrics.length) * 100) 
          : 0;
        
        return {
          range: range.range,
          count,
          percentage
        };
      });

      // Tendência de qualidade por dia
      const qualityTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayMetrics = qualityMetrics.filter(m => 
          format(new Date(m.metric_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        
        const dayResponseTime = dayMetrics.length > 0
          ? dayMetrics.reduce((sum, m) => sum + (m.response_time_avg_minutes || 0), 0) / dayMetrics.length
          : 0;
          
        const dayQuality = dayMetrics.length > 0
          ? dayMetrics.reduce((sum, m) => sum + (m.automated_quality_score || 0), 0) / dayMetrics.length
          : 0;

        qualityTrend.push({
          period: format(date, 'dd/MM'),
          responseTime: Math.round(dayResponseTime * 10) / 10,
          quality: Math.round(dayQuality * 10) / 10
        });
      }

      return {
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        avgQualityScore: Math.round(avgQualityScore * 10) / 10,
        totalAlerts: 0, // Alerts não implementados ainda
        hasData: true,
        responseTimeDistribution,
        qualityTrend
      };
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
}