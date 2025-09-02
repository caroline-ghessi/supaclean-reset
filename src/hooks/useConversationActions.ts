import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useAssumeConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('conversations')
        .update({
          status: 'with_agent',
          assigned_agent_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('status', 'in_bot') // Só permitir assumir se estiver com bot
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Conversa não pode ser assumida (pode já estar com agente)');

      // Log da ação
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'conversation_actions',
        message: `Conversa assumida por agente`,
        data: {
          conversation_id: conversationId,
          agent_id: user.id,
          previous_status: 'in_bot',
          new_status: 'with_agent'
        }
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      toast({
        title: 'Conversa assumida',
        description: 'Você assumiu o atendimento desta conversa.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao assumir conversa',
        description: error.message || 'Não foi possível assumir a conversa.',
        variant: 'destructive',
      });
    },
  });
}

export function useReturnConversationToBot() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('conversations')
        .update({
          status: 'in_bot',
          assigned_agent_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('assigned_agent_id', user.id) // Só permitir devolver se for o agente atual
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Você não pode devolver esta conversa (não é o agente responsável)');

      // Log da ação
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'conversation_actions',
        message: `Conversa devolvida ao bot`,
        data: {
          conversation_id: conversationId,
          agent_id: user.id,
          previous_status: 'with_agent',
          new_status: 'in_bot'
        }
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      toast({
        title: 'Conversa devolvida',
        description: 'A conversa foi devolvida ao bot.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao devolver conversa',
        description: error.message || 'Não foi possível devolver a conversa.',
        variant: 'destructive',
      });
    },
  });
}

export function useCloseConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ conversationId, reason }: { conversationId: string; reason: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('conversations')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
          metadata: {
            closed_at: new Date().toISOString(),
            closed_by: user.id,
            close_reason: reason,
            reactivation_count: 0
          }
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Não foi possível finalizar esta conversa');

      // Log da ação
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'conversation_actions',
        message: `Conversa finalizada`,
        data: {
          conversation_id: conversationId,
          agent_id: user.id,
          previous_status: data.status,
          new_status: 'closed',
          reason
        }
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      toast({
        title: 'Conversa finalizada',
        description: 'A conversa foi arquivada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao finalizar conversa',
        description: error.message || 'Não foi possível finalizar a conversa.',
        variant: 'destructive',
      });
    },
  });
}