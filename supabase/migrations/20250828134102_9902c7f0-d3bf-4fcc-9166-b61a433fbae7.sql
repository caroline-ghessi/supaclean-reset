-- =====================================================
-- SISTEMA RAG COMPLETO - TABELAS DE FEEDBACK E ANALYTICS
-- =====================================================

-- Tabela para feedback do conhecimento
CREATE TABLE IF NOT EXISTS knowledge_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_entry_id uuid NOT NULL REFERENCES agent_knowledge_files(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id),
  message_id uuid REFERENCES messages(id),
  feedback_type varchar(50) NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'outdated')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para log de uso do conhecimento
CREATE TABLE IF NOT EXISTS knowledge_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_ids uuid[] NOT NULL,
  query text NOT NULL,
  agent_type product_category NOT NULL,
  conversation_id uuid REFERENCES conversations(id),
  response_generated text,
  confidence_score float,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela para padrões de FAQ identificados
CREATE TABLE IF NOT EXISTS faq_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_text text NOT NULL,
  intent varchar(100) NOT NULL,
  agent_type product_category NOT NULL,
  frequency integer DEFAULT 1,
  last_seen timestamp with time zone DEFAULT now(),
  embedding vector(1536),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela para métricas e analytics
CREATE TABLE IF NOT EXISTS knowledge_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  agent_type product_category NOT NULL,
  total_queries integer DEFAULT 0,
  successful_responses integer DEFAULT 0,
  average_confidence float DEFAULT 0.0,
  knowledge_entries_used integer DEFAULT 0,
  new_knowledge_created integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(date, agent_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_entry_id ON knowledge_feedback(knowledge_entry_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_created_at ON knowledge_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faq_patterns_embedding ON faq_patterns USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_analytics_date ON knowledge_analytics(date DESC);

-- =====================================================
-- FUNÇÕES PARA BUSCA SEMÂNTICA MELHORADA
-- =====================================================

-- Função melhorada de busca semântica usando chunks
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

-- Função para atualizar score de confiança dos arquivos
CREATE OR REPLACE FUNCTION update_file_confidence_score(
  file_id uuid,
  feedback_type varchar,
  adjustment_factor float DEFAULT 0.1
)
RETURNS void
LANGUAGE plpgsql
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

-- Trigger para processar feedback automaticamente
CREATE OR REPLACE FUNCTION process_knowledge_feedback_trigger()
RETURNS trigger AS $$
BEGIN
  -- Atualizar score de confiabilidade
  PERFORM update_file_confidence_score(NEW.knowledge_entry_id, NEW.feedback_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_feedback_processor 
  AFTER INSERT ON knowledge_feedback 
  FOR EACH ROW EXECUTE FUNCTION process_knowledge_feedback_trigger();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE knowledge_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para feedback (usuários autenticados podem dar feedback)
CREATE POLICY "Feedback is manageable by authenticated users" 
  ON knowledge_feedback FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Políticas para usage log
CREATE POLICY "Usage log is readable by authenticated users" 
  ON knowledge_usage_log FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Usage log is insertable by authenticated users" 
  ON knowledge_usage_log FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Políticas para FAQ patterns
CREATE POLICY "FAQ patterns are manageable by authenticated users" 
  ON faq_patterns FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Políticas para analytics
CREATE POLICY "Analytics are readable by authenticated users" 
  ON knowledge_analytics FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Analytics are manageable by authenticated users" 
  ON knowledge_analytics FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Analytics are updatable by authenticated users" 
  ON knowledge_analytics FOR UPDATE 
  TO authenticated 
  USING (true);

-- Comentários para documentação
COMMENT ON TABLE knowledge_feedback IS 'Feedback dos usuários sobre a qualidade das respostas baseadas em conhecimento';
COMMENT ON TABLE knowledge_usage_log IS 'Log de uso da base de conhecimento para analytics e melhorias';
COMMENT ON TABLE faq_patterns IS 'Padrões de perguntas frequentes identificados automaticamente';
COMMENT ON TABLE knowledge_analytics IS 'Métricas agregadas diárias do sistema RAG';
COMMENT ON FUNCTION search_knowledge_enhanced IS 'Função aprimorada para busca semântica usando chunks de conhecimento';
COMMENT ON FUNCTION update_file_confidence_score IS 'Atualiza score de confiabilidade dos arquivos baseado no feedback';