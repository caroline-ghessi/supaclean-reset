import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logSystem } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ConversationFilters } from '@/types/conversation.types';

export function useConversations(filters?: ConversationFilters & { includeArchived?: boolean }) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          lead_distributions(id, sent_at, vendor_id, vendors(name))
        `)
        .eq('source', 'whatsapp');

      // Exclude closed conversations by default unless specifically requested
      if (!filters?.includeArchived) {
        query = query.neq('status', 'closed');
      }

      // Apply search filter
      if (filters?.search) {
        query = query.or(
          `customer_name.ilike.%${filters.search}%,whatsapp_name.ilike.%${filters.search}%,whatsapp_number.ilike.%${filters.search}%`
        );
      }

      // Apply status filter
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply product group filter
      if (filters?.product_group && filters.product_group.length > 0) {
        query = query.in('product_group', filters.product_group);
      }

      // Apply lead temperature filter
      if (filters?.lead_temperature && filters.lead_temperature.length > 0) {
        query = query.in('lead_temperature', filters.lead_temperature);
      }

      // Apply date range filter
      if (filters?.date_range) {
        query = query.gte('created_at', filters.date_range.start.toISOString());
        query = query.lte('created_at', filters.date_range.end.toISOString());
      }

      const { data, error } = await query
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (error) {
        await logSystem('error', 'useConversations', 'Failed to fetch conversations', error);
        throw error;
      }

      return (data || []).map((conv: any) => ({
        ...conv,
        // Use whatsapp_name as fallback for customer_name
        customer_name: conv.customer_name || conv.whatsapp_name || 'Usuário',
        lastMessage: undefined,
        unreadCount: 0,
        isDistributed: conv.lead_distributions && conv.lead_distributions.length > 0,
        distributedTo: conv.lead_distributions?.[0]?.vendors?.name || null,
        distributedAt: conv.lead_distributions?.[0]?.sent_at || null,
        created_at: new Date(conv.created_at || ''),
        updated_at: new Date(conv.updated_at || ''),
        first_message_at: new Date(conv.first_message_at || ''),
        last_message_at: new Date(conv.last_message_at || ''),
        metadata: (conv.metadata as Record<string, any>) || {},
      }));
    },
    staleTime: 30 * 1000,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        await logSystem('error', 'useConversation', `Failed to fetch conversation ${id}`, error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        // Use whatsapp_name as fallback for customer_name
        customer_name: data.customer_name || data.whatsapp_name || 'Usuário',
        created_at: new Date(data.created_at || ''),
        updated_at: new Date(data.updated_at || ''),
        first_message_at: new Date(data.first_message_at || ''),
        last_message_at: new Date(data.last_message_at || ''),
        metadata: (data.metadata as Record<string, any>) || {},
      };
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversation: any) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert([conversation])
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
    onError: () => {
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
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
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
    onError: () => {
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
    onError: () => {
      toast({
        title: 'Erro ao excluir conversa',
        description: 'Não foi possível excluir a conversa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}