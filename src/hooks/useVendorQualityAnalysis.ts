import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useVendorQualityAnalysis() {
  const queryClient = useQueryClient();

  const triggerAnalysis = useMutation({
    mutationFn: async ({ 
      conversationId, 
      vendorId, 
      forceAnalysis = false 
    }: { 
      conversationId: number; 
      vendorId: string; 
      forceAnalysis?: boolean;
    }) => {
      // Chamar a edge function de análise de qualidade
      const { data, error } = await supabase.functions.invoke('quality-analysis', {
        body: {
          conversationId,
          vendorId,
          forceAnalysis
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar análise de qualidade');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Análise de qualidade processada com sucesso');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['vendor-quality'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-conversations'] });
    },
    onError: (error: Error) => {
      console.error('Erro na análise de qualidade:', error);
      toast.error(`Erro na análise: ${error.message}`);
    }
  });

  const triggerBatchAnalysis = useMutation({
    mutationFn: async ({ vendorId }: { vendorId: string }) => {
      // Buscar conversas recentes do vendedor
      const { data: conversations } = await supabase
        .from('vendor_conversations')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('conversation_status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (!conversations || conversations.length === 0) {
        throw new Error('Nenhuma conversa encontrada para análise');
      }

      // Processar análises em paralelo
      const analysisPromises = conversations.map(conv => 
        supabase.functions.invoke('quality-analysis', {
          body: {
            conversationId: conv.id,
            vendorId,
            forceAnalysis: false
          }
        })
      );

      const results = await Promise.allSettled(analysisPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: conversations.length };
    },
    onSuccess: ({ successful, failed, total }) => {
      toast.success(`Análise em lote concluída: ${successful}/${total} processadas com sucesso`);
      if (failed > 0) {
        toast.warning(`${failed} análises falharam`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['vendor-quality'] });
    },
    onError: (error: Error) => {
      console.error('Erro na análise em lote:', error);
      toast.error(`Erro na análise em lote: ${error.message}`);
    }
  });

  return {
    triggerAnalysis: triggerAnalysis.mutate,
    triggerBatchAnalysis: triggerBatchAnalysis.mutate,
    isAnalyzing: triggerAnalysis.isPending,
    isBatchAnalyzing: triggerBatchAnalysis.isPending
  };
}