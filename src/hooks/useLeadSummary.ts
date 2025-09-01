import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LeadSummaryData {
  summary: string;
  conversation: any;
  mediaFiles: Array<{
    type: string;
    url: string;
    timestamp: string;
  }>;
  contextData: any;
}

export const useGenerateLeadSummary = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversationId: string): Promise<LeadSummaryData> => {
      const { data, error } = await supabase.functions.invoke('generate-lead-summary', {
        body: { conversationId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Resumo gerado",
        description: "Resumo do atendimento gerado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar resumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useSendLeadToVendor = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      conversationId,
      vendorId,
      summary,
      sentByAgentId
    }: {
      conversationId: string;
      vendorId: string;
      summary: string;
      sentByAgentId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-lead-to-vendor', {
        body: { conversationId, vendorId, summary, sentByAgentId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Lead enviado",
        description: `Lead enviado com sucesso para ${data.vendorName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};

export const useLeadDistributions = (conversationId?: string) => {
  return useQuery({
    queryKey: ['lead-distributions', conversationId],
    queryFn: async () => {
      const query = supabase
        .from('lead_distributions')
        .select(`
          *,
          vendors(name, phone_number)
        `)
        .order('sent_at', { ascending: false });

      if (conversationId) {
        query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
};