import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Vendor {
  id: string;
  name: string;
  phone_number: string;
  whapi_channel_id: string;
  token_configured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats?: {
    total_conversations: number;
    avg_response_time: number;
    quality_score: number;
  };
}

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_conversations(count)
        `)
        .order('name');

      if (error) throw error;

      // Buscar estatísticas para cada vendedor
      const vendorsWithStats = await Promise.all(
        (data || []).map(async (vendor) => {
          // Estatísticas de conversas
          const { data: conversationsCount } = await supabase
            .from('vendor_conversations')
            .select('id', { count: 'exact' })
            .eq('vendor_id', vendor.id)
            .eq('conversation_status', 'active');

          // Métricas de qualidade do último mês
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: metrics } = await supabase
            .from('quality_metrics')
            .select('response_time_avg_minutes, automated_quality_score')
            .eq('vendor_id', vendor.id)
            .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0]);

          const avgResponseTime = metrics && metrics.length > 0
            ? Math.round(metrics.reduce((acc, m) => acc + (m.response_time_avg_minutes || 0), 0) / metrics.length)
            : 0;

          const qualityScore = metrics && metrics.length > 0
            ? Math.round(metrics.reduce((acc, m) => acc + (m.automated_quality_score || 0), 0) / metrics.length)
            : 0;

          return {
            ...vendor,
            stats: {
              total_conversations: conversationsCount?.length || 0,
              avg_response_time: avgResponseTime,
              quality_score: qualityScore
            }
          };
        })
      );

      return vendorsWithStats as Vendor[];
    },
  });
}