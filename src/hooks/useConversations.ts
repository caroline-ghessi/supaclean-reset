import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logSystem } from '@/lib/supabase';
import { 
  Conversation, 
  ConversationFilters, 
  ConversationWithLastMessage 
} from '@/types/conversation.types';
import { useToast } from '@/hooks/use-toast';

export function useConversations(filters?: ConversationFilters) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('source', 'whatsapp') // Only show real WhatsApp conversations
        .order('last_message_at', { ascending: false })
        .limit(50);

      
      if (error) {
        await logSystem('error', 'useConversations', 'Failed to fetch conversations', error);
        throw error;
      }

      // Processar dados simplificado para evitar erro de tipo
      return (data || []).map((conv: any) => ({
        ...conv,
        lastMessage: undefined,
        unreadCount: 0,
        created_at: new Date(conv.created_at),
        updated_at: new Date(conv.updated_at),
        first_message_at: new Date(conv.first_message_at),
        last_message_at: new Date(conv.last_message_at),
        metadata: conv.metadata as Record<string, any> || {},
      }));
    },
    staleTime: 30 * 1000, // 30 segundos
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async (): Promise<Conversation | null> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        await logSystem('error', 'useConversation', `Failed to fetch conversation ${id}`, error);
        throw error;
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        first_message_at: new Date(data.first_message_at),
        last_message_at: new Date(data.last_message_at),
        metadata: data.metadata as Record<string, any> || {},
      };
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>) => {
      const insertData = {
        ...conversation,
        first_message_at: conversation.first_message_at.toISOString(),
        last_message_at: conversation.last_message_at.toISOString(),
      };
      
      const { data, error } = await supabase
        .from('conversations')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        await logSystem('error', 'useCreateConversation', 'Failed to create conversation', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Conversa criada',
        description: 'Nova conversa criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar conversa',
        description: 'Não foi possível criar a conversa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Conversation, 'id' | 'created_at'>> }) => {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        first_message_at: updates.first_message_at?.toISOString(),
        last_message_at: updates.last_message_at?.toISOString(),
      };
      
      const { data, error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        await logSystem('error', 'useUpdateConversation', `Failed to update conversation ${id}`, error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      toast({
        title: 'Conversa atualizada',
        description: 'Conversa atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar conversa',
        description: 'Não foi possível atualizar a conversa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);
      
      if (error) {
        await logSystem('error', 'useDeleteConversation', `Failed to delete conversation ${id}`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Conversa excluída',
        description: 'Conversa excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir conversa',
        description: 'Não foi possível excluir a conversa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}