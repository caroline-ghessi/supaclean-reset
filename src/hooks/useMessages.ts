import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logSystem } from '@/lib/supabase';
import { Message } from '@/types/conversation.types';
import { useToast } from '@/hooks/use-toast';

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        await logSystem('error', 'useMessages', `Failed to fetch messages for conversation ${conversationId}`, error);
        throw error;
      }

      return (data || []).map(msg => ({
        ...msg,
        created_at: new Date(msg.created_at),
        delivered_at: msg.delivered_at ? new Date(msg.delivered_at) : undefined,
        read_at: msg.read_at ? new Date(msg.read_at) : undefined,
        metadata: msg.metadata as Record<string, any> || {},
      }));
    },
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 segundos
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (message: Omit<Message, 'id' | 'created_at'>) => {
      const insertData = {
        ...message,
        created_at: new Date().toISOString(),
        delivered_at: message.delivered_at?.toISOString(),
        read_at: message.read_at?.toISOString(),
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        await logSystem('error', 'useCreateMessage', 'Failed to create message', error);
        throw error;
      }
      
      // Atualizar last_message_at da conversa
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', message.conversation_id);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();
      
      if (error) {
        await logSystem('error', 'useMarkMessageAsRead', `Failed to mark message ${messageId} as read`, error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAllMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('is_read', false);
      
      if (error) {
        await logSystem('error', 'useMarkAllMessagesAsRead', `Failed to mark all messages as read for conversation ${conversationId}`, error);
        throw error;
      }
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        await logSystem('error', 'useDeleteMessage', `Failed to delete message ${messageId}`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Mensagem excluída',
        description: 'Mensagem excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir mensagem',
        description: 'Não foi possível excluir a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}