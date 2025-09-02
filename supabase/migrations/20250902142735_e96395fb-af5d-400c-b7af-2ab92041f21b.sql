-- Adicionar novo tipo de agente para monitoramento de qualidade
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'quality_monitor';

-- Criar tabela para análises de qualidade dos vendedores
CREATE TABLE IF NOT EXISTS public.vendor_quality_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  conversation_id BIGINT NOT NULL,
  message_id BIGINT,
  analysis_data JSONB NOT NULL DEFAULT '{}',
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 10),
  criteria_scores JSONB NOT NULL DEFAULT '{}', -- scores individuais por critério
  issues_identified TEXT[],
  recommendations TEXT[],
  agent_id UUID,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para alertas de qualidade
CREATE TABLE IF NOT EXISTS public.quality_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  analysis_id UUID,
  alert_type VARCHAR(50) NOT NULL, -- 'low_quality', 'response_time', 'inappropriate_language', etc.
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.vendor_quality_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para vendor_quality_analysis
CREATE POLICY "Enable all for authenticated users on vendor_quality_analysis"
ON public.vendor_quality_analysis
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas RLS para quality_alerts
CREATE POLICY "Enable all for authenticated users on quality_alerts"
ON public.quality_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_vendor_quality_analysis_vendor_id ON public.vendor_quality_analysis(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quality_analysis_conversation_id ON public.vendor_quality_analysis(conversation_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quality_analysis_analyzed_at ON public.vendor_quality_analysis(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_vendor_id ON public.quality_alerts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_resolved ON public.quality_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_severity ON public.quality_alerts(severity);

-- Trigger para atualizar timestamps
CREATE TRIGGER update_vendor_quality_analysis_updated_at
  BEFORE UPDATE ON public.vendor_quality_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();