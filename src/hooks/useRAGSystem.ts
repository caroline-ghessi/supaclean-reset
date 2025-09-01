import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductCategory } from '@/types/conversation.types';

export interface RAGSearchResult {
  id: string;
  content: string;
  similarity: number;
  file_name: string;
  chunk_index: number;
  metadata: any;
  created_at: string;
}

export interface KnowledgeFeedback {
  knowledge_entry_id: string;
  conversation_id?: string;
  message_id?: string;
  feedback_type: 'helpful' | 'not_helpful' | 'incorrect' | 'outdated';
  rating?: number;
  feedback_text?: string;
}

export interface UsageLogEntry {
  knowledge_ids: string[];
  query: string;
  agent_type: ProductCategory;
  conversation_id?: string;
  response_generated?: string;
  confidence_score?: number;
}

// Hook para busca semântica RAG
export function useRAGSearch() {
  return useMutation({
    mutationFn: async ({ 
      query, 
      agentType, 
      threshold = 0.7, 
      limit = 10 
    }: {
      query: string;
      agentType: ProductCategory;
      threshold?: number;
      limit?: number;
    }) => {
      // Gerar embedding da consulta
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          fileId: 'query', 
          content: query, 
          generateChunks: false 
        }
      });

      if (embeddingError || !embeddingData?.success) {
        throw new Error('Erro ao gerar embedding da consulta');
      }

      // Buscar conhecimento relevante usando a função SQL
      const { data, error } = await supabase.rpc('search_knowledge_enhanced', {
        query_embedding: embeddingData.embedding,
        agent_filter: agentType as any, // Type will be updated after DB sync
        match_threshold: threshold,
        match_count: limit,
        include_general: true
      });

      if (error) throw error;
      return data as RAGSearchResult[];
    }
  });
}

// Hook para registrar feedback
export function useKnowledgeFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (feedback: KnowledgeFeedback) => {
      const { data, error } = await supabase
        .from('knowledge_feedback')
        .insert(feedback)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-analytics'] });
      toast({
        title: "Feedback registrado",
        description: "Obrigado pelo seu feedback! Isso nos ajuda a melhorar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar feedback",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// Hook para registrar uso de conhecimento
export function useKnowledgeUsageLog() {
  return useMutation({
    mutationFn: async (usage: UsageLogEntry) => {
      const { data, error } = await supabase
        .from('knowledge_usage_log')
        .insert(usage as any) // Type will be updated after DB sync
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
}

// Hook para métricas e analytics
export function useKnowledgeAnalytics(agentType?: ProductCategory, days = 30) {
  return useQuery({
    queryKey: ['knowledge-analytics', agentType, days],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_analytics')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (agentType) {
        query = query.eq('agent_type', agentType as any); // Type will be updated after DB sync
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}

// Hook para padrões de FAQ
export function useFAQPatterns(agentType?: ProductCategory) {
  return useQuery({
    queryKey: ['faq-patterns', agentType],
    queryFn: async () => {
      let query = supabase
        .from('faq_patterns')
        .select('*')
        .order('frequency', { ascending: false })
        .order('last_seen', { ascending: false })
        .limit(20);

      if (agentType) {
        query = query.eq('agent_type', agentType as any); // Type will be updated after DB sync
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}

// Hook para gerar embeddings de arquivos processados
export function useGenerateEmbeddings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      // Buscar o arquivo e seu conteúdo
      const { data: file, error: fileError } = await supabase
        .from('agent_knowledge_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError || !file) {
        throw new Error('Arquivo não encontrado');
      }

      if (!file.extracted_content) {
        throw new Error('Arquivo não possui conteúdo extraído');
      }

      // Chamar função para gerar embeddings
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          fileId: file.id,
          content: file.extracted_content,
          generateChunks: true
        }
      });

      if (error) throw error;
      return { ...data, agentCategory: file.agent_category };
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['knowledge-files'] });
      
      toast({
        title: "Embeddings gerados com sucesso",
        description: `${data.chunksCreated} chunks criados para busca semântica.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar embeddings",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}