-- Tabela para vendedores
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  whapi_token VARCHAR(255) NOT NULL,
  whapi_channel_id VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para conversas dos vendedores (apenas individuais)
CREATE TABLE public.vendor_conversations (
  id BIGSERIAL PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  chat_id VARCHAR(255) NOT NULL, 
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  customer_profile_pic TEXT,
  conversation_status VARCHAR(50) DEFAULT 'active',
  last_message_at TIMESTAMP WITH TIME ZONE,
  total_messages INTEGER DEFAULT 0,
  vendor_messages INTEGER DEFAULT 0,
  customer_messages INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, chat_id)
);

-- Tabela para mensagens dos vendedores
CREATE TABLE public.vendor_messages (
  id BIGSERIAL PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  conversation_id BIGINT NOT NULL REFERENCES vendor_conversations(id),
  whapi_message_id VARCHAR(255) NOT NULL,
  chat_id VARCHAR(255) NOT NULL,
  from_me BOOLEAN NOT NULL,
  from_phone VARCHAR(20),
  from_name VARCHAR(255),
  message_type VARCHAR(50) NOT NULL,
  content TEXT,
  media_url TEXT,
  media_metadata JSONB,
  timestamp_whatsapp TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20),
  is_forwarded BOOLEAN DEFAULT false,
  reply_to_message_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(whapi_message_id, vendor_id)
);

-- Tabela para análise de qualidade
CREATE TABLE public.quality_metrics (
  id BIGSERIAL PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  conversation_id BIGINT NOT NULL REFERENCES vendor_conversations(id),
  metric_date DATE NOT NULL,
  response_time_avg_minutes INTEGER,
  response_time_max_minutes INTEGER,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  conversation_satisfaction_score INTEGER CHECK (conversation_satisfaction_score >= 1 AND conversation_satisfaction_score <= 5),
  automated_quality_score FLOAT,
  flags JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, conversation_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all for authenticated users" ON public.vendors FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.vendor_conversations FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.vendor_messages FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.quality_metrics FOR ALL USING (true);

-- Índices para performance
CREATE INDEX idx_vendor_conversations_vendor_id ON vendor_conversations(vendor_id);
CREATE INDEX idx_vendor_conversations_last_message ON vendor_conversations(last_message_at DESC);
CREATE INDEX idx_vendor_messages_vendor_timestamp ON vendor_messages(vendor_id, timestamp_whatsapp DESC);
CREATE INDEX idx_vendor_messages_conversation ON vendor_messages(conversation_id, timestamp_whatsapp DESC);

-- Trigger para updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_conversations_updated_at BEFORE UPDATE ON vendor_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();