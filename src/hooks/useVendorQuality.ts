import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVendorQuality(vendorId: string, periodDays: string) {
  return useQuery({
    queryKey: ['vendor-quality', vendorId, periodDays],
    queryFn: async () => {
      const days = parseInt(periodDays);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Buscar análises de qualidade do agente de IA
      const { data: qualityAnalysis } = await supabase
        .from('vendor_quality_analysis')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('analyzed_at', startDate.toISOString())
        .order('analyzed_at', { ascending: false });

      // Buscar alertas de qualidade
      const { data: qualityAlerts } = await supabase
        .from('quality_alerts')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Buscar métricas tradicionais como fallback
      const { data: metrics } = await supabase
        .from('quality_metrics')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('metric_date', startDate.toISOString().split('T')[0]);

      // Buscar conversas recentes
      const { data: conversations } = await supabase
        .from('vendor_conversations')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('last_message_at', startDate.toISOString())
        .order('last_message_at', { ascending: false })
        .limit(10);

      // Calcular estatísticas baseadas nas análises do agente de IA
      let avgResponseTime = 0;
      let qualityScore = 0;
      let satisfactionRate = 0;

      if (qualityAnalysis && qualityAnalysis.length > 0) {
        // Usar dados do agente de IA
        qualityScore = qualityAnalysis.reduce((acc, analysis) => {
          return acc + (Number(analysis.quality_score) || 0);
        }, 0) / qualityAnalysis.length;

        // Calcular tempo de resposta médio das análises
        const responseTimeData = qualityAnalysis
          .map(a => {
            const data = a.analysis_data as any;
            return data?.response_time_minutes;
          })
          .filter(t => t != null);
        
        avgResponseTime = responseTimeData.length > 0
          ? responseTimeData.reduce((acc, time) => acc + time, 0) / responseTimeData.length
          : 0;

        // Calcular satisfação baseada nos critérios do agente
        const satisfactionData = qualityAnalysis
          .map(a => {
            const scores = a.criteria_scores as any;
            return scores?.satisfaction_score || scores?.overall_experience;
          })
          .filter(s => s != null);
        
        satisfactionRate = satisfactionData.length > 0
          ? satisfactionData.reduce((acc, score) => acc + score, 0) / satisfactionData.length * 10
          : qualityScore * 10;
      } else if (metrics && metrics.length > 0) {
        // Fallback para métricas tradicionais
        avgResponseTime = Math.round(metrics.reduce((acc, m) => acc + (m.response_time_avg_minutes || 0), 0) / metrics.length);
        qualityScore = metrics.reduce((acc, m) => acc + (m.automated_quality_score || 0), 0) / metrics.length;
        satisfactionRate = qualityScore > 0 ? qualityScore * 10 : 85;
      }

      const totalConversations = conversations?.length || 0;
      const activeConversations = conversations?.filter(c => c.conversation_status === 'active').length || 0;

      // Usar alertas reais do agente de IA
      const alerts = qualityAlerts?.map(alert => ({
        id: alert.id,
        type: alert.severity,
        title: alert.title,
        description: alert.description,
        created_at: alert.created_at,
        resolved: alert.resolved,
        metadata: alert.metadata
      })) || [];

      // Adicionar métricas de análise às conversas
      const conversationsWithMetrics = conversations?.map(conv => {
        const analysis = qualityAnalysis?.find(a => a.conversation_id === conv.id);
        const traditionalMetrics = metrics?.find(m => m.conversation_id === conv.id);
        
        return {
          ...conv,
          response_time: (analysis?.analysis_data as any)?.response_time_minutes || 
                        traditionalMetrics?.response_time_avg_minutes || 0,
          quality_score: analysis?.quality_score || traditionalMetrics?.automated_quality_score || 0,
          analysis_data: analysis?.analysis_data,
          criteria_scores: analysis?.criteria_scores,
          recommendations: analysis?.recommendations,
          issues_identified: analysis?.issues_identified
        };
      }) || [];

      return {
        avgResponseTime: Math.round(avgResponseTime),
        qualityScore: Number(qualityScore.toFixed(1)),
        totalConversations,
        activeConversations,
        satisfactionRate: Number(satisfactionRate.toFixed(1)),
        recentConversations: conversationsWithMetrics,
        alerts,
        qualityAnalysis: qualityAnalysis || [],
        hasAiAnalysis: (qualityAnalysis && qualityAnalysis.length > 0)
      };
    },
    enabled: !!vendorId,
  });
}