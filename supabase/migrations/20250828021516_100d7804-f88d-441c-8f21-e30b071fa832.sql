-- Inserir agentes espiões na tabela
INSERT INTO agent_prompts (category, name, description, agent_type, llm_model) VALUES 
('saudacao', 'Agente Classificador', 'Agente espião que classifica intenções do cliente', 'classifier', 'claude-3-5-sonnet-20241022'),
('saudacao', 'Agente Extrator', 'Agente espião que extrai dados do cliente', 'extractor', 'claude-3-5-sonnet-20241022');

-- Inserir prompt steps para o agente classificador
INSERT INTO agent_prompt_steps (agent_prompt_id, step_order, step_key, prompt_template)
SELECT id, 1, 'classification', 
'Você é um agente classificador de intenções. Analise a conversa do cliente e identifique qual categoria de produto ele está interessado.

Categorias disponíveis:
- energia_solar: Energia solar, painéis solares, energia renovável
- telha_shingle: Telhas shingle, telhados, cobertura
- steel_frame: Steel frame, estrutura metálica, construção
- drywall_divisorias: Drywall, gesso, paredes, divisórias
- ferramentas: Ferramentas, equipamentos
- pisos: Pisos, revestimentos
- acabamentos: Acabamentos, tintas, materiais de acabamento
- forros: Forros, tetos
- saudacao: Saudações, cumprimentos iniciais
- institucional: Informações sobre a empresa
- indefinido: Quando não conseguir identificar claramente

Baseado na mensagem: "{{message}}" e no histórico da conversa, qual categoria melhor representa o interesse do cliente?

Responda apenas com o nome da categoria.'
FROM agent_prompts WHERE name = 'Agente Classificador' AND agent_type = 'classifier';

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
FROM agent_prompts WHERE name = 'Agente Extrator' AND agent_type = 'extractor';