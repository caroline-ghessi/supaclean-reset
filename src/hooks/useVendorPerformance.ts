import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface VendorPerformanceData {
  vendorId: string;
  vendorName: string;
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  qualityScore: number;
  conversionRate: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

interface VendorAnalytics {
  vendors: VendorPerformanceData[];
  totalVendors: number;
  avgResponseTime: number;
  avgQualityScore: number;
  topPerformers: VendorPerformanceData[];
  performanceComparison: {
    period: string;
    responseTime: number;
    conversations: number;
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

const getPerformanceLevel = (metrics: {
  responseTime: number;
  qualityScore: number;
  conversionRate: number;
}): VendorPerformanceData['performance'] => {
  const score = (
    (metrics.responseTime < 3 ? 3 : metrics.responseTime < 5 ? 2 : 1) +
    (metrics.qualityScore > 8 ? 3 : metrics.qualityScore > 6 ? 2 : 1) +
    (metrics.conversionRate > 10 ? 3 : metrics.conversionRate > 5 ? 2 : 1)
  ) / 3;

  if (score >= 2.5) return 'excellent';
  if (score >= 2) return 'good';
  if (score >= 1.5) return 'average';
  return 'poor';
};

export function useVendorPerformance(period: string = '7d') {
  return useQuery({
    queryKey: ['vendor-performance', period],
    queryFn: async (): Promise<VendorAnalytics> => {
      const { startDate, endDate } = getPeriodDates(period);
      
      // Buscar vendedores
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true);

      if (vendorsError) throw vendorsError;

      // Buscar conversas dos vendedores no período
      const { data: conversations, error: conversationsError } = await supabase
        .from('vendor_conversations')
        .select(`
          *,
          vendor_id,
          conversation_status,
          total_messages,
          vendor_messages,
          customer_messages,
          created_at,
          updated_at
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversationsError) throw conversationsError;

      // Buscar métricas de qualidade
      const { data: qualityMetrics, error: qualityError } = await supabase
        .from('quality_metrics')
        .select('*')
        .gte('metric_date', format(startDate, 'yyyy-MM-dd'))
        .lte('metric_date', format(endDate, 'yyyy-MM-dd'));

      if (qualityError) throw qualityError;

      // Processar dados por vendedor
      const vendorPerformance: VendorPerformanceData[] = vendors?.map(vendor => {
        const vendorConversations = conversations?.filter(c => c.vendor_id === vendor.id) || [];
        const vendorQuality = qualityMetrics?.filter(q => q.vendor_id === vendor.id) || [];

        const totalConversations = vendorConversations.length;
        const activeConversations = vendorConversations.filter(c => 
          c.conversation_status === 'active'
        ).length;
        
        const totalMessages = vendorConversations.reduce((sum, c) => 
          sum + (c.total_messages || 0), 0
        );

        const avgResponseTime = vendorQuality.length > 0
          ? vendorQuality.reduce((sum, q) => sum + (q.response_time_avg_minutes || 0), 0) / vendorQuality.length
          : 0;

        const qualityScore = vendorQuality.length > 0
          ? vendorQuality.reduce((sum, q) => sum + (q.automated_quality_score || 0), 0) / vendorQuality.length
          : 0;

        const conversionRate = totalConversations > 0
          ? (vendorConversations.filter(c => c.conversation_status === 'completed').length / totalConversations) * 100
          : 0;

        const performance = getPerformanceLevel({
          responseTime: avgResponseTime,
          qualityScore,
          conversionRate
        });

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          totalConversations,
          activeConversations,
          totalMessages,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          qualityScore: Math.round(qualityScore * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
          performance
        };
      }) || [];

      // Calcular métricas agregadas
      const totalVendors = vendorPerformance.length;
      const avgResponseTime = vendorPerformance.length > 0
        ? vendorPerformance.reduce((sum, v) => sum + v.avgResponseTime, 0) / vendorPerformance.length
        : 0;
      
      const avgQualityScore = vendorPerformance.length > 0
        ? vendorPerformance.reduce((sum, v) => sum + v.qualityScore, 0) / vendorPerformance.length
        : 0;

      // Top performers (top 3)
      const topPerformers = [...vendorPerformance]
        .sort((a, b) => {
          const scoreA = (a.qualityScore * 0.4) + ((10 - a.avgResponseTime) * 0.3) + (a.conversionRate * 0.3);
          const scoreB = (b.qualityScore * 0.4) + ((10 - b.avgResponseTime) * 0.3) + (b.conversionRate * 0.3);
          return scoreB - scoreA;
        })
        .slice(0, 3);

      // Dados de comparação temporal baseados em dados reais
      const performanceComparison = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayQuality = qualityMetrics?.filter(q => 
          format(new Date(q.metric_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ) || [];
        
        const dayResponseTime = dayQuality.length > 0
          ? dayQuality.reduce((sum, q) => sum + (q.response_time_avg_minutes || 0), 0) / dayQuality.length
          : 0;
          
        const dayConversations = conversations?.filter(c => 
          format(new Date(c.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ).length || 0;
        
        const dayQualityScore = dayQuality.length > 0
          ? dayQuality.reduce((sum, q) => sum + (q.automated_quality_score || 0), 0) / dayQuality.length
          : 0;

        performanceComparison.push({
          period: format(date, 'dd/MM'),
          responseTime: Math.round(dayResponseTime * 10) / 10,
          conversations: dayConversations,
          quality: Math.round(dayQualityScore * 10) / 10
        });
      }

      return {
        vendors: vendorPerformance,
        totalVendors,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        avgQualityScore: Math.round(avgQualityScore * 10) / 10,
        topPerformers,
        performanceComparison
      };
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
}