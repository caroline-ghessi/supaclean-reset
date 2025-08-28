import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVendorQuality(vendorId: string, periodDays: string) {
  return useQuery({
    queryKey: ['vendor-quality', vendorId, periodDays],
    queryFn: async () => {
      const days = parseInt(periodDays);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Buscar métricas de qualidade
      const { data: metrics } = await supabase
        .from('quality_metrics')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('metric_date', startDate.toISOString().split('T')[0]);

      // Buscar conversas recentes
      const { data: conversations } = await supabase
        .from('vendor_conversations')
        .select(`
          *,
          vendor_messages!inner(*)
        `)
        .eq('vendor_id', vendorId)
        .gte('last_message_at', startDate.toISOString())
        .order('last_message_at', { ascending: false })
        .limit(10);

      // Calcular estatísticas
      const avgResponseTime = metrics && metrics.length > 0
        ? Math.round(metrics.reduce((acc, m) => acc + (m.response_time_avg_minutes || 0), 0) / metrics.length)
        : 0;

      const qualityScore = metrics && metrics.length > 0
        ? metrics.reduce((acc, m) => acc + (m.automated_quality_score || 0), 0) / metrics.length
        : 0;

      const totalConversations = conversations?.length || 0;
      const activeConversations = conversations?.filter(c => c.conversation_status === 'active').length || 0;

      // Simular taxa de satisfação (seria calculada por IA)
      const satisfactionRate = qualityScore > 0 ? qualityScore * 10 : 85;

      // Gerar alertas baseados nas métricas
      const alerts = [];
      
      if (avgResponseTime > 15) {
        alerts.push({
          type: 'critical',
          title: 'Tempo de resposta alto',
          description: `Tempo médio de ${avgResponseTime} minutos está acima da meta de 15 minutos.`,
          created_at: new Date().toISOString()
        });
      }
      
      if (qualityScore < 6 && qualityScore > 0) {
        alerts.push({
          type: 'warning',
          title: 'Score de qualidade baixo',
          description: 'O score de qualidade está abaixo do esperado. Revisar estratégia de atendimento.',
          created_at: new Date().toISOString()
        });
      }

      // Adicionar métricas de resposta às conversas
      const conversationsWithMetrics = conversations?.map(conv => {
        const convMetrics = metrics?.find(m => m.conversation_id === conv.id);
        return {
          ...conv,
          response_time: convMetrics?.response_time_avg_minutes || 0
        };
      }) || [];

      return {
        avgResponseTime,
        qualityScore,
        totalConversations,
        activeConversations,
        satisfactionRate,
        recentConversations: conversationsWithMetrics,
        alerts
      };
    },
    enabled: !!vendorId,
  });
}