import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, logSystem } from '@/lib/supabase';
import { REALTIME_CHANNELS } from '@/lib/constants';

export function useRealtimeConversations() {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channel = supabase
      .channel(REALTIME_CHANNELS.conversations)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async (payload) => {
          await logSystem('debug', 'realtime-conversations', 'Conversation change detected', payload);
          
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          if (payload.new && 'id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['conversation', payload.new.id] });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);

  return channelRef.current;
}

export function useRealtimeMessages(conversationId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(REALTIME_CHANNELS.messages)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          await logSystem('debug', 'realtime-messages', 'Message change detected', payload);
          
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, queryClient]);

  return channelRef.current;
}

export function useRealtimeSystemEvents() {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channel = supabase
      .channel(REALTIME_CHANNELS.system)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs'
        },
        async (payload) => {
          // Log importante para debugging
          if (payload.new?.level === 'error') {
            console.error('System error logged:', payload.new);
          }
          
          // Invalidar logs query se necessário
          queryClient.invalidateQueries({ queryKey: ['system-logs'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);

  return channelRef.current;
}