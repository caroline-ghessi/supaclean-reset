-- Expandir tabela agent_prompts para controle total dos agentes
ALTER TABLE agent_prompts 
ADD COLUMN IF NOT EXISTS llm_model varchar(50) DEFAULT 'claude-3-5-sonnet-20241022',
ADD COLUMN IF NOT EXISTS knowledge_base text,
ADD COLUMN IF NOT EXISTS agent_type varchar(20) DEFAULT 'specialist';

-- Inserir agentes espiões usando categorias existentes
INSERT INTO agent_prompts (category, name, description, agent_type, llm_model) VALUES 
('indefinido', 'Agente Classificador', 'Agente espião que classifica intenções do cliente', 'classifier', 'claude-3-5-sonnet-20241022'),
('indefinido', 'Agente Extrator', 'Agente espião que extrai dados do cliente', 'extractor', 'claude-3-5-sonnet-20241022');