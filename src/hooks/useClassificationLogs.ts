import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClassificationLog {
  id: string;
  conversation_id?: string;
  message_text: string;
  classified_category?: string;
  confidence_score?: number;
  processing_time_ms?: number;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function useClassificationLogs(limit = 20) {
  return useQuery({
    queryKey: ['classification-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ClassificationLog[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });
}

export function useAddClassificationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Omit<ClassificationLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('classification_logs')
        .insert([log])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification-logs'] });
    }
  });
}

export function useClassificationStats() {
  return useQuery({
    queryKey: ['classification-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's stats
      const { data: todayLogs, error } = await supabase
        .from('classification_logs')
        .select('*')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`);

      if (error) throw error;

      const totalClassifications = todayLogs.length;
      const successfulClassifications = todayLogs.filter(log => log.status === 'success').length;
      const unclassified = todayLogs.filter(log => !log.classified_category || log.classified_category === 'indefinido' || (log.confidence_score && log.confidence_score < 70)).length;
      const averageTime = totalClassifications > 0 ? todayLogs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / totalClassifications : 0;
      const accuracyRate = totalClassifications > 0 ? (successfulClassifications / totalClassifications) * 100 : 0;

      return {
        totalClassifications,
        accuracyRate: Math.round(accuracyRate),
        unclassified,
        averageTime: Math.round(averageTime) / 1000, // Convert to seconds
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}