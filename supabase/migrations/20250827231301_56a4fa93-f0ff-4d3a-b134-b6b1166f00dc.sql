-- Add source column to conversations table to distinguish between whatsapp, test, and manual conversations
ALTER TABLE conversations 
ADD COLUMN source VARCHAR(20) DEFAULT 'test' CHECK (source IN ('whatsapp', 'test', 'manual'));

-- Update existing conversations to be marked as test since they are not real WhatsApp conversations
UPDATE conversations 
SET source = 'test' 
WHERE source IS NULL;

-- Create index for better performance when filtering by source
CREATE INDEX idx_conversations_source ON conversations(source);

-- Add comment to document the column
COMMENT ON COLUMN conversations.source IS 'Source of the conversation: whatsapp (real), test (simulated), manual (created manually)';