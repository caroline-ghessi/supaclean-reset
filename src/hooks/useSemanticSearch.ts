import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductCategory } from '@/types/conversation.types';

interface SemanticSearchResult {
  id: string;
  content: string;
  similarity: number;
  file_name: string;
  chunk_index?: number;
  metadata: any;
}

interface UseSemanticSearchProps {
  query: string;
  agentCategory: ProductCategory;
  enabled?: boolean;
  similarityThreshold?: number;
  maxResults?: number;
}

export function useSemanticSearch({
  query,
  agentCategory,
  enabled = true,
  similarityThreshold = 0.7,
  maxResults = 5
}: UseSemanticSearchProps) {
  return useQuery({
    queryKey: ['semanticSearch', query, agentCategory, similarityThreshold, maxResults],
    queryFn: async (): Promise<SemanticSearchResult[]> => {
      if (!query.trim()) return [];

      // First generate embedding for the query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          content: query,
          generateChunks: false // Only generate embedding for the query
        }
      });

      if (embeddingError) {
        throw new Error(`Failed to generate query embedding: ${embeddingError.message}`);
      }

      const queryEmbedding = embeddingData.embedding;

      // Search knowledge chunks using the embedding
      const { data, error } = await supabase.rpc('search_knowledge_chunks', {
        query_embedding: queryEmbedding,
        target_agent_category: agentCategory as any, // Type will be updated after DB sync
        similarity_threshold: similarityThreshold,
        max_results: maxResults
      });

      if (error) {
        throw new Error(`Semantic search failed: ${error.message}`);
      }

      return data || [];
    },
    enabled: enabled && !!query.trim() && !!agentCategory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSemanticSearchFiles({
  query,
  agentCategory,
  enabled = true,
  similarityThreshold = 0.7,
  maxResults = 3
}: UseSemanticSearchProps) {
  return useQuery({
    queryKey: ['semanticSearchFiles', query, agentCategory, similarityThreshold, maxResults],
    queryFn: async (): Promise<SemanticSearchResult[]> => {
      if (!query.trim()) return [];

      // Generate embedding for the query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          content: query,
          generateChunks: false
        }
      });

      if (embeddingError) {
        throw new Error(`Failed to generate query embedding: ${embeddingError.message}`);
      }

      const queryEmbedding = embeddingData.embedding;

      // Search knowledge files using the embedding
      const { data, error } = await supabase.rpc('search_knowledge_files', {
        query_embedding: queryEmbedding,
        target_agent_category: agentCategory as any, // Type will be updated after DB sync
        similarity_threshold: similarityThreshold,
        max_results: maxResults
      });

      if (error) {
        throw new Error(`Semantic search failed: ${error.message}`);
      }

      return data || [];
    },
    enabled: enabled && !!query.trim() && !!agentCategory,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}