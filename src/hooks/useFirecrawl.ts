import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProductCategory } from '@/types/conversation.types';

interface FirecrawlRequest {
  url: string;
  agentCategory: ProductCategory;
  mode: 'scrape' | 'crawl';
  options?: {
    maxDepth?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
}

interface FirecrawlResponse {
  success: boolean;
  message: string;
  processedFiles: number;
  files: any[];
  error?: string;
}

export const useFirecrawlScrape = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: FirecrawlRequest): Promise<FirecrawlResponse> => {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: request,
      });

      if (error) {
        throw new Error(error.message || 'Failed to scrape content');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message);
      // Invalidate knowledge files query for this agent
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-files', variables.agentCategory] 
      });
    },
    onError: (error: Error) => {
      console.error('Firecrawl error:', error);
      toast.error(error.message || 'Failed to scrape content');
    },
  });
};