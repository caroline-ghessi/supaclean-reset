-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to agent_knowledge_files
ALTER TABLE public.agent_knowledge_files 
ADD COLUMN IF NOT EXISTS content_embedding vector(1536);

-- Create knowledge_chunks table for better RAG performance
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_category product_category NOT NULL,
  file_id uuid NOT NULL REFERENCES public.agent_knowledge_files(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  content_embedding vector(1536),
  token_count integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on knowledge_chunks
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS policy for knowledge_chunks - authenticated users can access all
CREATE POLICY "Enable all for authenticated users" ON public.knowledge_chunks
FOR ALL USING (true);

-- Create index for vector similarity search on agent_knowledge_files
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_files_embedding_cosine 
ON public.agent_knowledge_files 
USING ivfflat (content_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for vector similarity search on knowledge_chunks
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_cosine 
ON public.knowledge_chunks 
USING ivfflat (content_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for faster filtering by agent_category
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_agent_category 
ON public.knowledge_chunks (agent_category);

-- Create index for faster filtering by file_id
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_file_id 
ON public.knowledge_chunks (file_id);

-- Create function to search knowledge chunks with semantic similarity
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(
  query_embedding vector(1536),
  target_agent_category product_category,
  similarity_threshold float DEFAULT 0.7,
  max_results integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  file_name character varying,
  chunk_index integer,
  metadata jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    kc.id,
    kc.content,
    1 - (kc.content_embedding <=> query_embedding) as similarity,
    akf.file_name,
    kc.chunk_index,
    kc.metadata
  FROM public.knowledge_chunks kc
  JOIN public.agent_knowledge_files akf ON kc.file_id = akf.id
  WHERE 
    kc.agent_category = target_agent_category
    AND kc.content_embedding IS NOT NULL
    AND 1 - (kc.content_embedding <=> query_embedding) > similarity_threshold
  ORDER BY kc.content_embedding <=> query_embedding
  LIMIT max_results;
$$;

-- Create function to search knowledge files with semantic similarity (backup)
CREATE OR REPLACE FUNCTION public.search_knowledge_files(
  query_embedding vector(1536),
  target_agent_category product_category,
  similarity_threshold float DEFAULT 0.7,
  max_results integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  file_name character varying,
  metadata jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    akf.id,
    akf.extracted_content as content,
    1 - (akf.content_embedding <=> query_embedding) as similarity,
    akf.file_name,
    akf.metadata
  FROM public.agent_knowledge_files akf
  WHERE 
    akf.agent_category = target_agent_category
    AND akf.content_embedding IS NOT NULL
    AND akf.extracted_content IS NOT NULL
    AND 1 - (akf.content_embedding <=> query_embedding) > similarity_threshold
  ORDER BY akf.content_embedding <=> query_embedding
  LIMIT max_results;
$$;

-- Add trigger to update updated_at on knowledge_chunks
CREATE TRIGGER update_knowledge_chunks_updated_at
  BEFORE UPDATE ON public.knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();