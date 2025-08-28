import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClassificationKeyword {
  id: string;
  category: string;
  keyword: string;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useClassificationKeywords() {
  return useQuery({
    queryKey: ['classification-keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classification_keywords')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('weight', { ascending: false });

      if (error) throw error;
      return data as ClassificationKeyword[];
    }
  });
}

export function useClassificationKeywordsByCategory(category: string) {
  return useQuery({
    queryKey: ['classification-keywords', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classification_keywords')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('weight', { ascending: false });

      if (error) throw error;
      return data as ClassificationKeyword[];
    }
  });
}

export function useAddKeyword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (keyword: Omit<ClassificationKeyword, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('classification_keywords')
        .insert([keyword])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification-keywords'] });
      toast({
        title: "Palavra-chave adicionada",
        description: "Nova palavra-chave foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar palavra-chave",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useUpdateKeyword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClassificationKeyword> }) => {
      const { data, error } = await supabase
        .from('classification_keywords')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification-keywords'] });
      toast({
        title: "Palavra-chave atualizada",
        description: "Palavra-chave foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar palavra-chave",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classification_keywords')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification-keywords'] });
      toast({
        title: "Palavra-chave removida",
        description: "Palavra-chave foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover palavra-chave",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}