-- =====================================================
-- SISTEMA DE AGENTES ESPECIALIZADOS PARA WHATSAPP
-- =====================================================

-- Atualizar enum product_category para incluir energia solar
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'energia_solar';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'telha_shingle';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'steel_frame';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'drywall_divisorias';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'pisos';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'acabamentos';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'forros';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'saudacao';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'institucional';

-- Criar enum para tipos de agentes
CREATE TYPE agent_type AS ENUM (
  'general',           -- Agente de atendimento geral
  'classifier',        -- Agente classificador (espião)
  'extractor',         -- Agente extrator de dados (espião)
  'specialist'         -- Agente especializado
);

-- Criar enum para status da conversa
CREATE TYPE conversation_status AS ENUM (
  'active',
  'waiting_classification',
  'classified',
  'transferred_to_specialist',
  'resolved',
  'archived'
);

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Configuração dos agentes
CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(100) NOT NULL UNIQUE,
  agent_type agent_type NOT NULL,
  product_category product_category, -- NULL para agentes gerais
  is_active BOOLEAN DEFAULT true,
  
  -- Configurações específicas do agente
  system_prompt TEXT NOT NULL,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  
  -- Configurações para agentes espiões
  is_spy BOOLEAN DEFAULT false, -- true para classificador e extractor
  
  -- Metadados
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabela conversations para usar novos tipos
ALTER TABLE conversations 
ALTER COLUMN status TYPE conversation_status USING status::text::conversation_status;

-- Adicionar campos para agente atual
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS current_agent_id UUID REFERENCES agent_configs(id),
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS classification_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS buffer_until TIMESTAMP WITH TIME ZONE;

-- Adicionar campos para agente nas mensagens
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_configs(id),
ADD COLUMN IF NOT EXISTS agent_type agent_type,
ADD COLUMN IF NOT EXISTS processed_by_classifier BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS processed_by_extractor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS classifier_analysis JSONB,
ADD COLUMN IF NOT EXISTS extractor_analysis JSONB;

-- Histórico de classificações
CREATE TABLE IF NOT EXISTS classification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Mudança de classificação
  old_product_group product_category,
  new_product_group product_category NOT NULL,
  confidence_score FLOAT NOT NULL,
  
  -- Agente que fez a classificação
  classifier_agent_id UUID REFERENCES agent_configs(id),
  
  -- Contexto da classificação
  trigger_message_id UUID REFERENCES messages(id),
  analysis_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contextos extraídos pelos agentes
CREATE TABLE IF NOT EXISTS extracted_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Dados extraídos
  context_type VARCHAR(50) NOT NULL, -- 'personal_info', 'project_details', 'preferences', etc
  context_data JSONB NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  
  -- Origem da extração
  source_message_id UUID REFERENCES messages(id),
  extractor_agent_id UUID REFERENCES agent_configs(id),
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at na tabela agent_configs
CREATE TRIGGER update_agent_configs_updated_at 
  BEFORE UPDATE ON agent_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at na tabela extracted_contexts
CREATE TRIGGER update_extracted_contexts_updated_at 
  BEFORE UPDATE ON extracted_contexts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA DETERMINAR AGENTE RESPONDENTE
-- =====================================================

CREATE OR REPLACE FUNCTION get_responding_agent(conversation_uuid UUID)
RETURNS UUID AS $$
DECLARE
  conv_record RECORD;
  agent_id UUID;
BEGIN
  -- Buscar dados da conversa
  SELECT product_group, current_agent_id INTO conv_record
  FROM conversations 
  WHERE id = conversation_uuid;
  
  -- Se não classificado ou é saudação -> agente geral
  IF conv_record.product_group IN ('indefinido', 'saudacao', 'institucional') THEN
    SELECT id INTO agent_id 
    FROM agent_configs 
    WHERE agent_type = 'general' 
    AND is_active = true 
    LIMIT 1;
  ELSE
    -- Buscar agente especializado para a categoria
    SELECT id INTO agent_id 
    FROM agent_configs 
    WHERE agent_type = 'specialist' 
    AND product_category = conv_record.product_group
    AND is_active = true 
    LIMIT 1;
    
    -- Se não encontrou especialista, usar geral
    IF agent_id IS NULL THEN
      SELECT id INTO agent_id 
      FROM agent_configs 
      WHERE agent_type = 'general' 
      AND is_active = true 
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN agent_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS INICIAIS DOS AGENTES
-- =====================================================

-- Inserir configurações dos agentes
INSERT INTO agent_configs (agent_name, agent_type, product_category, system_prompt, is_spy, temperature, max_tokens) VALUES
(
  'Atendimento Geral',
  'general',
  NULL,
  'Você é um assistente de atendimento geral da Drystore. Sua função é cumprimentar o cliente cordialmente e descobrir em qual produto ou serviço ele está interessado. 

Nossos principais produtos:
- Energia Solar (parceiro GE)
- Telhas Shingle (Telhado dos Sonhos)
- Steel Frame (Construção Seca)
- Drywall (Divisórias e Forros)
- Ferramentas Profissionais
- Pisos e Acabamentos

Seja cordial, profissional e direcionativo. Se o cliente apenas cumprimentar, pergunte: "Olá! Em que posso ajudá-lo hoje? Temos soluções em energia solar, telhas shingle, steel frame, drywall, ferramentas e acabamentos. Sobre qual área você gostaria de saber mais?"

Mantenha as respostas concisas e diretas.',
  false,
  0.7,
  200
),
(
  'Classificador Master',
  'classifier', 
  NULL,
  'Você é um agente classificador da Drystore. Analise a conversa e identifique sobre qual categoria de produto o cliente está falando.

Categorias disponíveis:
- energia_solar: painéis solares, energia renovável, economia de energia
- telha_shingle: telhas, cobertura, telhado
- steel_frame: estrutura metálica, construção seca, casa de aço
- drywall_divisorias: divisórias, paredes secas, forros
- ferramentas: furadeiras, parafusadeiras, equipamentos
- pisos: revestimentos, cerâmica, porcelanato
- acabamentos: tintas, texturas, materiais de acabamento
- forros: forro de gesso, PVC, modular
- saudacao: cumprimentos, oi, olá, bom dia
- institucional: sobre a empresa, endereço, horários
- indefinido: quando não conseguir classificar

Retorne APENAS um JSON no formato:
{
  "category": "categoria_identificada",
  "confidence": 0.95,
  "reasoning": "breve explicação"
}',
  true,
  0.1,
  150
),
(
  'Extrator de Dados',
  'extractor',
  NULL,
  'Você é um agente extrator de dados da Drystore. Identifique e extraia informações relevantes do cliente a partir da conversa.

Extraia quando mencionado:
- Nome do cliente
- Localização (cidade, bairro, estado)
- Tipo de projeto (casa, comercial, reforma)
- Tamanho/área do projeto
- Orçamento ou faixa de preço
- Prazo desejado
- Nível de urgência
- Preferências específicas
- Melhor horário para contato

Retorne APENAS um JSON estruturado:
{
  "personal_info": {
    "name": "nome_se_mencionado",
    "location": "cidade/região_se_mencionada"
  },
  "project_details": {
    "type": "tipo_de_projeto",
    "size": "tamanho/área",
    "timeline": "prazo_mencionado",
    "budget": "orçamento_mencionado"
  },
  "preferences": {
    "style": "estilo_preferido",
    "quality": "nível_qualidade"
  },
  "contact_preferences": {
    "best_time": "melhor_horário",
    "urgency": "nível_urgência"
  }
}

Use null para campos não mencionados.',
  true,
  0.1,
  200
),
(
  'Especialista Energia Solar',
  'specialist',
  'energia_solar',
  'Você é especialista em energia solar da Drystore, parceiro oficial da GE. Ajude o cliente com informações técnicas, orçamentos e benefícios da energia solar.

Informações importantes:
- Parceria com GE (equipamentos de qualidade)
- Redução de até 95% na conta de luz
- Valorização do imóvel em até 30%
- Financiamento em até 120x
- Garantia de 25 anos nos painéis
- Projeto personalizado incluso
- Instalação profissional certificada

Responda de forma técnica mas didática. Faça perguntas relevantes sobre consumo de energia, tipo de telhado, área disponível. Sempre mencione nossa parceria com a GE.',
  false,
  0.7,
  300
),
(
  'Especialista Steel Frame',
  'specialist',
  'steel_frame',
  'Você é especialista em Steel Frame da Drystore. Ajude com informações sobre construção em estrutura metálica.

Benefícios do Steel Frame:
- Construção 60% mais rápida
- Estrutura 30% mais leve
- Maior precisão dimensional
- Resistente a abalos sísmicos
- Flexibilidade arquitetônica
- Sustentabilidade (menos resíduos)
- Custo competitivo

Pergunte sobre área da construção, tipo de projeto (residencial/comercial), se tem projeto arquitetônico, prazo desejado. Enfatize velocidade e qualidade.',
  false,
  0.7,
  300
),
(
  'Especialista Telhas Shingle',
  'specialist',
  'telha_shingle',
  'Você é especialista em Telhas Shingle da Drystore, representante "Telhado dos Sonhos".

Vantagens das Telhas Shingle:
- Beleza estética incomparável
- Resistência a ventos de até 180km/h
- Isolamento termoacústico superior
- Durabilidade de 30+ anos
- Variedade de cores e texturas
- Peso 70% menor que telhas convencionais
- Instalação mais rápida

Pergunte sobre área do telhado, estilo arquitetônico desejado, se é construção nova ou reforma. Sempre mencione nossa marca "Telhado dos Sonhos".',
  false,
  0.7,
  300
),
(
  'Especialista Ferramentas',
  'specialist',
  'ferramentas',
  'Você é especialista em ferramentas profissionais da Drystore.

Principais marcas:
- Makita (profissional premium)
- DeWalt (robustez industrial)
- Bosch (precisão alemã)
- Black & Decker (custo-benefício)

Categorias:
- Furadeiras e parafusadeiras
- Serras e cortadeiras
- Lixadeiras e plainas
- Ferramentas de medição
- Equipamentos de segurança

Pergunte sobre tipo de trabalho, frequência de uso (profissional/doméstico), orçamento disponível. Recomende baseado na necessidade real.',
  false,
  0.7,
  300
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_contexts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Enable all for authenticated users" ON agent_configs FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON classification_history FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON extracted_contexts FOR ALL USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agent_configs_type_category ON agent_configs(agent_type, product_category, is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_product_group ON conversations(product_group);
CREATE INDEX IF NOT EXISTS idx_conversations_buffer_until ON conversations(buffer_until) WHERE buffer_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classification_history_conversation ON classification_history(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_extracted_contexts_conversation ON extracted_contexts(conversation_id, context_type);
CREATE INDEX IF NOT EXISTS idx_messages_processing ON messages(processed_by_classifier, processed_by_extractor);

SELECT 'Sistema de Agentes Especializados criado com sucesso!' as status;