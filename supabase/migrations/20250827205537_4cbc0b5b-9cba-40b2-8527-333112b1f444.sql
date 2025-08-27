-- CRIAÇÃO DO SCHEMA COMPLETO PARA SISTEMA DRYSTORE
-- Sistema de atendimento WhatsApp com bot inteligente

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums para type safety
CREATE TYPE conversation_status AS ENUM (
  'waiting',
  'active', 
  'in_bot',
  'with_agent',
  'qualified',
  'transferred',
  'closed'
);

CREATE TYPE sender_type AS ENUM (
  'customer',
  'bot', 
  'agent',
  'system'
);

CREATE TYPE lead_temperature AS ENUM (
  'cold',
  'warm',
  'hot'
);

CREATE TYPE product_category AS ENUM (
  'telha_shingle',
  'energia_solar',
  'steel_frame', 
  'drywall_divisorias',
  'ferramentas',
  'pisos',
  'acabamentos',
  'forros',
  'saudacao',
  'institucional',
  'indefinido'
);

-- Tabela principal de conversas
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_city VARCHAR(100),
  customer_state VARCHAR(2),
  product_group product_category DEFAULT 'indefinido',
  status conversation_status DEFAULT 'waiting',
  lead_temperature lead_temperature DEFAULT 'cold',
  lead_score INTEGER DEFAULT 0,
  assigned_agent_id UUID,
  first_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Índices para performance
CREATE INDEX idx_conversations_whatsapp ON conversations(whatsapp_number);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_product ON conversations(product_group);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- Tabela de mensagens  
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  sender_name VARCHAR(255),
  content TEXT NOT NULL,
  media_url TEXT,
  media_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Índices para mensagens
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Tabela de contexto do projeto
CREATE TABLE project_contexts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Informações gerais
  whatsapp_confirmed VARCHAR(20),
  
  -- Específico para energia solar
  energy_consumption VARCHAR(100),
  energy_bill_value DECIMAL(10,2),
  has_energy_backups BOOLEAN,
  
  -- Específico para telhas
  roof_status VARCHAR(50), -- 'nova_construcao' ou 'reforma'
  roof_size_m2 DECIMAL(10,2),
  
  -- Específico para steel frame
  has_architectural_project BOOLEAN,
  project_status VARCHAR(100),
  construction_size_m2 DECIMAL(10,2),
  
  -- Específico para pisos
  floor_quantity_m2 DECIMAL(10,2),
  floor_rooms TEXT,
  
  -- Listas e produtos
  materials_list TEXT[],
  desired_product TEXT,
  
  -- Metadados
  urgency VARCHAR(20), -- 'low', 'medium', 'high'
  budget_range VARCHAR(50),
  timeline VARCHAR(100),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de respostas
CREATE TABLE bot_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category product_category NOT NULL,
  intent VARCHAR(100) NOT NULL,
  language VARCHAR(10) DEFAULT 'pt-BR',
  template_text TEXT NOT NULL,
  quick_replies JSONB,
  next_intents TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, intent, language)
);

-- Tabela de configurações
CREATE TABLE system_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs para debug
CREATE TABLE system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'debug'
  source VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_contexts_updated_at 
  BEFORE UPDATE ON project_contexts  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policies básicas (permitir acesso completo por enquanto)
CREATE POLICY "Enable all for authenticated users" ON conversations
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON messages
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON project_contexts
  FOR ALL USING (true);

CREATE POLICY "Enable read for active templates" ON bot_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Enable all for system configs" ON system_configs
  FOR ALL USING (true);

CREATE POLICY "Enable all for system logs" ON system_logs
  FOR ALL USING (true);

-- Enable realtime para tabelas principais
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;