-- Fix security issues from linter

-- 1. Fix function search_path for search_knowledge_chunks
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
SECURITY DEFINER
SET search_path = public
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

-- 2. Fix function search_path for search_knowledge_files  
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
SECURITY DEFINER
SET search_path = public
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