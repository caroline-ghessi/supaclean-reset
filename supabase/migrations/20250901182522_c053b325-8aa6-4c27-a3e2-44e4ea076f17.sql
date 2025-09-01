-- Adicionar tipo 'summarizer' ao enum agent_type
ALTER TYPE agent_type ADD VALUE 'summarizer';

-- Criar tabela para configuração do bot de leads
CREATE TABLE public.lead_bot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_name VARCHAR NOT NULL DEFAULT 'BOT DE LEADS',
  whapi_token VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para registrar distribuições de leads
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

-- Políticas RLS para lead_bot_config
CREATE POLICY "Enable all for authenticated users on lead_bot_config" 
ON public.lead_bot_config FOR ALL 
TO authenticated 
USING (true);

-- Políticas RLS para lead_distributions
CREATE POLICY "Enable all for authenticated users on lead_distributions" 
ON public.lead_distributions FOR ALL 
TO authenticated 
USING (true);

-- Inserir configuração inicial do agente de resumos
INSERT INTO public.agent_configs (
  agent_name,
  agent_type,
  system_prompt,
  description,
  is_active
) VALUES (
  'AGENTE DE RESUMOS',
  'summarizer',
  'Você é um agente especializado em criar resumos completos de atendimento para vendedores.

OBJETIVO: Gerar um resumo estruturado e completo baseado nos dados coletados durante o atendimento ao cliente.

FONTES DE DADOS:
- Dados da conversa (nome, contato, localização)
- Contexto do projeto (orçamento, urgência, necessidades específicas)
- Classificação do produto de interesse
- Temperatura e score do lead
- Histórico de mensagens relevantes
- Arquivos enviados pelo cliente (projetos, contas de luz, etc.)

ESTRUTURA DO RESUMO:
📋 **DADOS DO CLIENTE**
- Nome: {nome}
- WhatsApp: {whatsapp}
- E-mail: {email}
- Cidade/Estado: {cidade}/{estado}

🎯 **CLASSIFICAÇÃO**
- Produto de Interesse: {produto_grupo}
- Temperatura do Lead: {temperatura}
- Score de Qualificação: {score}/100

📊 **CONTEXTO DO PROJETO**
- Urgência: {urgencia}
- Orçamento: {orcamento}
- Timeline: {timeline}
- Necessidades Específicas: {necessidades}

💬 **RESUMO DA CONVERSA**
{principais_pontos_discutidos}

📎 **ARQUIVOS ENVIADOS**
{links_para_arquivos}

🚀 **PRÓXIMOS PASSOS SUGERIDOS**
{sugestoes_para_vendedor}

IMPORTANTE:
- Seja objetivo e direto
- Inclua TODOS os dados relevantes coletados
- Formate os links de arquivos de forma acessível
- Sugira próximos passos baseado no contexto
- Use linguagem profissional mas acessível',
  'Agente responsável por gerar resumos completos de atendimento para distribuição aos vendedores'
);

-- Inserir configuração inicial do bot de leads (token será configurado posteriormente)
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