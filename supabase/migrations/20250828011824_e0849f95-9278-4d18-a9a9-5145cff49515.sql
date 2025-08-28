-- Expandir tabela agent_prompts para controle total dos agentes
ALTER TABLE agent_prompts 
ADD COLUMN llm_model varchar(50) DEFAULT 'claude-3-5-sonnet-20241022',
ADD COLUMN knowledge_base text,
ADD COLUMN agent_type varchar(20) DEFAULT 'specialist';

-- Inserir agentes espiões na tabela
INSERT INTO agent_prompts (category, name, description, agent_type, llm_model) VALUES 
('indefinido', 'Agente Classificador', 'Agente espião que classifica intenções do cliente', 'classifier', 'claude-3-5-sonnet-20241022'),
('indefinido', 'Agente Extrator', 'Agente espião que extrai dados do cliente', 'extractor', 'claude-3-5-sonnet-20241022');

-- Inserir prompt steps para o agente classificador
INSERT INTO agent_prompt_steps (agent_prompt_id, step_order, step_key, prompt_template)
SELECT id, 1, 'classification', 
'Você é um agente classificador de intenções. Analise a conversa do cliente e identifique qual categoria de produto ele está interessado.

Categorias disponíveis:
- energia_solar: Energia solar, painéis solares, energia renovável
- telha_shingle: Telhas shingle, telhados, cobertura
- steel_frame: Steel frame, estrutura metálica, construção
- drywall: Drywall, gesso, paredes
- ferramentas: Ferramentas, equipamentos
- pisos: Pisos, revestimentos
- acabamentos: Acabamentos, tintas, materiais de acabamento
- forros: Forros, tetos
- indefinido: Quando não conseguir identificar ou for saudação inicial

Baseado na mensagem: "{{message}}" e no histórico da conversa, qual categoria melhor representa o interesse do cliente?

Responda apenas com o nome da categoria.'
FROM agent_prompts WHERE name = 'Agente Classificador';

-- Inserir prompt steps para o agente extrator
INSERT INTO agent_prompt_steps (agent_prompt_id, step_order, step_key, prompt_template)
SELECT id, 1, 'extraction', 
'Você é um agente extrator de dados. Analise toda a conversa e extraia informações relevantes do cliente.

Extraia as seguintes informações quando disponíveis:
- Nome do cliente
- WhatsApp/telefone 
- Email
- Cidade
- Estado
- Orçamento/valor mencionado
- Urgência
- Tamanho do projeto
- Materiais específicos mencionados
- Timeline desejado

Baseado na conversa completa, extraia os dados em formato JSON estruturado.

Histórico da conversa:
{{conversation_history}}

Última mensagem: "{{message}}"

Responda apenas com um JSON válido contendo os dados extraídos.'
FROM agent_prompts WHERE name = 'Agente Extrator';