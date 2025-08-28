-- Primeiro adicionar as colunas necessárias
ALTER TABLE agent_prompts 
ADD COLUMN IF NOT EXISTS llm_model varchar(50) DEFAULT 'claude-3-5-sonnet-20241022',
ADD COLUMN IF NOT EXISTS knowledge_base text,
ADD COLUMN IF NOT EXISTS agent_type varchar(20) DEFAULT 'specialist';

-- Atualizar registros existentes para specialist
UPDATE agent_prompts SET agent_type = 'specialist' WHERE agent_type IS NULL;

-- Remover constraint que impede múltiplos agentes por categoria
DROP INDEX IF EXISTS agent_prompts_category_is_active_key;
ALTER TABLE agent_prompts DROP CONSTRAINT IF EXISTS agent_prompts_category_is_active_key;

-- Criar nova constraint que permite múltiplos agentes por categoria
CREATE UNIQUE INDEX agent_prompts_category_type_active_idx 
ON agent_prompts (category, agent_type) 
WHERE is_active = true;