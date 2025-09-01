-- Criar tabelas para o sistema de leads
CREATE TABLE public.lead_bot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_name VARCHAR NOT NULL DEFAULT 'BOT DE LEADS',
  whapi_token VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  summary_text TEXT NOT NULL,
  sent_by_agent_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status VARCHAR DEFAULT 'sent',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.lead_bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distributions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Enable all for authenticated users on lead_bot_config" 
ON public.lead_bot_config FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all for authenticated users on lead_distributions" 
ON public.lead_distributions FOR ALL TO authenticated USING (true);

-- Inserir agente de resumos
INSERT INTO public.agent_configs (
  agent_name,
  agent_type,
  system_prompt,
  description
) VALUES (
  'AGENTE DE RESUMOS',
  'summarizer',
  'Você é um agente especializado em criar resumos completos de atendimento para vendedores. Gere um resumo estruturado baseado nos dados coletados durante o atendimento.',
  'Agente responsável por gerar resumos completos de atendimento para distribuição aos vendedores'
);

-- Configuração inicial do bot de leads
INSERT INTO public.lead_bot_config (
  bot_name,
  whapi_token,
  phone_number,
  is_active
) VALUES (
  'BOT DE LEADS',
  'TOKEN_PLACEHOLDER',
  'PHONE_PLACEHOLDER',
  false
);