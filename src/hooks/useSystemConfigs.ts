import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

export function useSystemConfig(key: string) {
  return useQuery({
    queryKey: ['system-config', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configs')
        .select('*')
        .eq('key', key)
        .single();

      if (error) throw error;
      return data as SystemConfig;
    }
  });
}

export function useSystemConfigs(keys?: string[]) {
  return useQuery({
    queryKey: ['system-configs', keys],
    queryFn: async () => {
      let query = supabase.from('system_configs').select('*');
      
      if (keys && keys.length > 0) {
        query = query.in('key', keys);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SystemConfig[];
    }
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data, error } = await supabase
        .from('system_configs')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-config', data.key] });
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}