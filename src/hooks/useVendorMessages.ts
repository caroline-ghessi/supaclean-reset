import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVendorMessages(conversationId: number, realTimeEnabled: boolean = true) {
  const query = useQuery({
    queryKey: ['vendor-messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp_whatsapp', { ascending: true })
        .limit(200);

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!realTimeEnabled || !conversationId) return;

    const channel = supabase
      .channel('vendor_messages_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vendor_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, () => {
        // Invalidar query para refetch
        query.refetch();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'vendor_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, () => {
        query.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, realTimeEnabled, query]);

  return query;
}