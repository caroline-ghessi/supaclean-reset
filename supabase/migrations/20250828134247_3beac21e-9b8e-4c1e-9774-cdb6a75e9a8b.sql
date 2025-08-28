-- Corrigir search_path das funções para segurança
CREATE OR REPLACE FUNCTION search_knowledge_enhanced(
  query_embedding vector(1536),
  agent_filter product_category DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count integer DEFAULT 10,
  include_general boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  file_name varchar,
  chunk_index integer,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    1 - (kc.content_embedding <=> query_embedding) AS similarity,
    akf.file_name,
    kc.chunk_index,
    kc.metadata,
    kc.created_at
  FROM knowledge_chunks kc
  JOIN agent_knowledge_files akf ON kc.file_id = akf.id
  WHERE 
    kc.content_embedding IS NOT NULL
    AND (
      agent_filter IS NULL 
      OR kc.agent_category = agent_filter 
      OR (include_general AND kc.agent_category = 'geral'::product_category)
    )
    AND (1 - (kc.content_embedding <=> query_embedding)) > match_threshold
  ORDER BY 
    kc.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Corrigir função de confidence score
CREATE OR REPLACE FUNCTION update_file_confidence_score(
  file_id uuid,
  feedback_type varchar,
  adjustment_factor float DEFAULT 0.1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  score_adjustment float;
  current_score float;
BEGIN
  -- Determinar ajuste baseado no tipo de feedback
  CASE feedback_type
    WHEN 'helpful' THEN score_adjustment := adjustment_factor;
    WHEN 'not_helpful' THEN score_adjustment := -adjustment_factor;
    WHEN 'incorrect' THEN score_adjustment := -(adjustment_factor * 2);
    WHEN 'outdated' THEN score_adjustment := -(adjustment_factor * 1.5);
    ELSE score_adjustment := 0;
  END CASE;

  -- Buscar score atual (usando metadados)
  SELECT COALESCE((metadata->>'confidence_score')::float, 1.0) 
  INTO current_score 
  FROM agent_knowledge_files 
  WHERE id = file_id;

  -- Atualizar score mantendo entre 0.1 e 1.0
  UPDATE agent_knowledge_files 
  SET 
    metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{confidence_score}',
      to_jsonb(GREATEST(0.1, LEAST(1.0, current_score + score_adjustment)))
    ),
    updated_at = now()
  WHERE id = file_id;
END;
$$;

-- Corrigir função de trigger
CREATE OR REPLACE FUNCTION process_knowledge_feedback_trigger()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar score de confiabilidade
  PERFORM update_file_confidence_score(NEW.knowledge_entry_id, NEW.feedback_type);
  RETURN NEW;
END;
$$;