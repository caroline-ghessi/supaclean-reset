-- Passo 1: Deletar agentes duplicados criados recentemente em agent_configs
DELETE FROM agent_configs 
WHERE id IN (
  '405ab61f-b932-4750-8d45-5873db4cdb9b', -- Especialista Isolamento Acústico
  '8d204561-7b36-4b15-ba38-66ce5b9680f3', -- Especialista Forros  
  '867ef13d-8b63-4f5b-b6ba-e8e5c9e6f939', -- Especialista Pisos
  'f7c8f1bc-18b6-418c-ae72-21809f196614'  -- Especialista Acabamentos
);

-- Passo 2: Migrar agentes de agent_prompts para agent_configs (preservando IDs e configurações)
-- Inserir apenas se não existir ainda na tabela agent_configs

-- Agente Energia Solar
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em energia solar. Ajude os clientes com informações técnicas e comerciais sobre sistemas fotovoltaicos.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'energia_solar'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'energia_solar' 
    AND ac.agent_type = 'specialist'
  );

-- Agente Telha Shingle
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em telha shingle. Ajude os clientes com informações sobre coberturas e telhados.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'telha_shingle'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'telha_shingle' 
    AND ac.agent_type = 'specialist'
  );

-- Agente Steel Frame
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em steel frame. Ajude os clientes com informações sobre construção em aço.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'steel_frame'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'steel_frame' 
    AND ac.agent_type = 'specialist'
  );

-- Agente Drywall
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em drywall e divisórias. Ajude os clientes com informações sobre paredes secas.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'drywall_divisorias'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'drywall_divisorias' 
    AND ac.agent_type = 'specialist'
  );

-- Agente Ferramentas
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em ferramentas. Ajude os clientes com informações sobre equipamentos e ferramentas.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'ferramentas'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'ferramentas' 
    AND ac.agent_type = 'specialist'
  );

-- Agente Forros
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em forros. Ajude os clientes com informações sobre diferentes tipos de forros e instalação.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'forros'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'forros' 
    AND ac.agent_type = 'specialist'
  );

-- Agente Pisos
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em pisos. Ajude os clientes com informações sobre diferentes tipos de pisos e revestimentos.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'pisos'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'pisos' 
    AND ac.agent_type = 'specialist'
  );

-- Agente Acabamentos
INSERT INTO agent_configs (
  id, agent_name, agent_type, product_category, system_prompt, 
  is_active, temperature, max_tokens, is_spy, description, llm_model
)
SELECT 
  ap.id,
  ap.name,
  'specialist'::agent_type,
  ap.category,
  COALESCE(ap.knowledge_base, 'Você é um especialista em acabamentos. Ajude os clientes com informações sobre materiais de acabamento e aplicação.'),
  ap.is_active,
  0.7,
  1000,
  false,
  ap.description,
  COALESCE(ap.llm_model, 'claude-3-5-sonnet-20241022')
FROM agent_prompts ap
WHERE ap.category = 'acabamentos'
  AND ap.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM agent_configs ac 
    WHERE ac.product_category = 'acabamentos' 
    AND ac.agent_type = 'specialist'
  );