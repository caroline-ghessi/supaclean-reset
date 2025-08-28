-- Expandir tabela agent_prompts para controle total dos agentes
ALTER TABLE agent_prompts 
ADD COLUMN IF NOT EXISTS llm_model varchar(50) DEFAULT 'claude-3-5-sonnet-20241022',
ADD COLUMN IF NOT EXISTS knowledge_base text,
ADD COLUMN IF NOT EXISTS agent_type varchar(20) DEFAULT 'specialist';

-- Remover constraint que impede múltiplos agentes por categoria
ALTER TABLE agent_prompts DROP CONSTRAINT IF EXISTS agent_prompts_category_is_active_key;

-- Criar constraint única que permite múltiplos agentes por categoria mas únicos por type+category
ALTER TABLE agent_prompts ADD CONSTRAINT agent_prompts_category_type_active_key 
UNIQUE (category, agent_type, is_active);

-- Inserir agentes espiões na tabela
INSERT INTO agent_prompts (category, name, description, agent_type, llm_model) VALUES 
('classifier', 'Agente Classificador', 'Agente espião que classifica intenções do cliente', 'classifier', 'claude-3-5-sonnet-20241022'),
('extractor', 'Agente Extrator', 'Agente espião que extrai dados do cliente', 'extractor', 'claude-3-5-sonnet-20241022')
ON CONFLICT (category, agent_type, is_active) DO NOTHING;