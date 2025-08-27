-- Add WhatsApp specific fields and tables for Business API integration

-- Create message status enum
CREATE TYPE message_status AS ENUM (
  'sending',
  'sent', 
  'delivered',
  'read',
  'failed'
);

-- Add WhatsApp specific fields to conversations table
ALTER TABLE conversations ADD COLUMN whatsapp_name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN profile_pic_url TEXT;

-- Add WhatsApp specific fields to messages table  
ALTER TABLE messages ADD COLUMN whatsapp_message_id VARCHAR(255) UNIQUE;
ALTER TABLE messages ADD COLUMN status message_status DEFAULT 'sending';

-- Create webhook logs table for debugging WhatsApp webhooks
CREATE TABLE webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  webhook_type VARCHAR(50),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message buffers table for grouping rapid messages
CREATE TABLE message_buffers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  buffer_started_at TIMESTAMPTZ DEFAULT NOW(),
  should_process_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ
);

-- Create conversation analytics table
CREATE TABLE conversation_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  total_conversations INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  hot_leads INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  conversion_rate DECIMAL(5,2),
  by_category JSONB,
  UNIQUE(date)
);

-- Add indexes for performance
CREATE INDEX idx_whatsapp_msg_id ON messages(whatsapp_message_id);
CREATE INDEX idx_message_status ON messages(status);
CREATE INDEX idx_webhook_created ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_processed ON webhook_logs(processed, created_at);
CREATE INDEX idx_buffer_pending ON message_buffers(processed, should_process_at);

-- Enable RLS for new tables
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_buffers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Enable all for authenticated users" ON webhook_logs
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON message_buffers
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON conversation_analytics
  FOR ALL USING (true);