import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVendorConversations(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-conversations', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_conversations')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('conversation_status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}