-- Insert default system configurations
INSERT INTO system_configs (key, value, description) VALUES
('master_agent_welcome_message', '"Olá! 😊 Bem-vindo à Drystore!\n\nSou o assistente virtual e estou aqui para ajudar você a encontrar a melhor solução.\n\n**Como posso ajudar hoje?**"', 'Mensagem de boas-vindas do agente master')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_configs (key, value, description) VALUES
('master_agent_fallback_message', '"Entendi sua mensagem!\n\nPara melhor atendimento, você pode:\n- Escolher uma das opções abaixo\n- Pedir para falar com um especialista\n\n**Principais áreas que atendemos:**"', 'Mensagem quando não entende a intenção')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_configs (key, value, description) VALUES
('master_agent_min_confidence', '0.7', 'Confiança mínima para classificação (0.0 a 1.0)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_configs (key, value, description) VALUES
('master_agent_buffer_time', '30', 'Tempo de buffer para agrupar mensagens (segundos)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_configs (key, value, description) VALUES
('master_agent_collect_name', 'true', 'Se deve coletar nome do cliente')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_configs (key, value, description) VALUES
('master_agent_show_buttons', 'true', 'Se deve mostrar botões de resposta rápida')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_configs (key, value, description) VALUES
('master_agent_multi_category', 'false', 'Se permite múltiplas categorias simultaneamente')
ON CONFLICT (key) DO NOTHING;

-- Insert default classification keywords
INSERT INTO classification_keywords (category, keyword, weight, is_active) VALUES
-- Energia Solar
('energia_solar', 'solar', 10, true),
('energia_solar', 'energia', 8, true),
('energia_solar', 'painel', 9, true),
('energia_solar', 'painéis', 9, true),
('energia_solar', 'bateria', 7, true),
('energia_solar', 'backup', 6, true),
('energia_solar', 'inversor', 8, true),
('energia_solar', 'conta de luz', 10, true),
('energia_solar', 'energia limpa', 8, true),
('energia_solar', 'fotovoltaico', 9, true),
('energia_solar', 'kwp', 7, true),
('energia_solar', 'geração', 6, true),

-- Telha Shingle
('telha_shingle', 'telha', 10, true),
('telha_shingle', 'telhado', 10, true),
('telha_shingle', 'shingle', 10, true),
('telha_shingle', 'cobertura', 8, true),
('telha_shingle', 'owens corning', 9, true),
('telha_shingle', 'iko', 8, true),
('telha_shingle', 'reforma telhado', 9, true),

-- Steel Frame
('steel_frame', 'steel frame', 10, true),
('steel_frame', 'steel', 8, true),
('steel_frame', 'estrutura metálica', 9, true),
('steel_frame', 'construção seca', 8, true),
('steel_frame', 'estrutura de aço', 9, true),
('steel_frame', 'lsf', 7, true),
('steel_frame', 'light steel', 8, true),

-- Drywall
('drywall_divisorias', 'drywall', 10, true),
('drywall_divisorias', 'dry wall', 10, true),
('drywall_divisorias', 'placa', 7, true),
('drywall_divisorias', 'chapa', 6, true),
('drywall_divisorias', 'divisória', 9, true),
('drywall_divisorias', 'parede', 6, true),
('drywall_divisorias', 'gesso', 7, true),
('drywall_divisorias', 'acartonado', 8, true),
('drywall_divisorias', 'knauf', 8, true),
('drywall_divisorias', 'placo', 8, true),

-- Ferramentas
('ferramentas', 'furadeira', 9, true),
('ferramentas', 'parafusadeira', 9, true),
('ferramentas', 'makita', 8, true),
('ferramentas', 'dewalt', 8, true),
('ferramentas', 'serra', 7, true),
('ferramentas', 'ferramenta', 10, true),
('ferramentas', 'máquina', 6, true),
('ferramentas', 'esmerilhadeira', 8, true),
('ferramentas', 'lixadeira', 8, true),
('ferramentas', 'martelete', 8, true),
('ferramentas', 'kit ferramenta', 9, true),

-- Pisos
('pisos', 'piso', 10, true),
('pisos', 'vinílico', 9, true),
('pisos', 'laminado', 9, true),
('pisos', 'carpete', 8, true),
('pisos', 'manta', 7, true),
('pisos', 'rodapé', 7, true),
('pisos', 'porcelanato', 8, true),
('pisos', 'cerâmica', 7, true),
('pisos', 'revestimento', 6, true),

-- Acabamentos
('acabamentos', 'tinta', 8, true),
('acabamentos', 'textura', 7, true),
('acabamentos', 'massa corrida', 8, true),
('acabamentos', 'selador', 7, true),
('acabamentos', 'verniz', 7, true),
('acabamentos', 'santa luzia', 8, true),
('acabamentos', 'acabamento', 9, true),

-- Forros
('forros', 'forro', 10, true),
('forros', 'gesso', 7, true),
('forros', 'pvc', 8, true),
('forros', 'modular', 7, true),
('forros', 'rebaixamento', 8, true),

-- Saudação
('saudacao', 'oi', 10, true),
('saudacao', 'olá', 10, true),
('saudacao', 'ola', 10, true),
('saudacao', 'bom dia', 9, true),
('saudacao', 'boa tarde', 9, true),
('saudacao', 'boa noite', 9, true),
('saudacao', 'hello', 8, true),
('saudacao', 'hey', 8, true),

-- Institucional
('institucional', 'onde fica', 8, true),
('institucional', 'endereço', 9, true),
('institucional', 'localização', 8, true),
('institucional', 'horário', 8, true),
('institucional', 'telefone', 8, true),
('institucional', 'quem são', 8, true),
('institucional', 'sobre a empresa', 9, true),
('institucional', 'drystore', 10, true)
ON CONFLICT (category, keyword) DO NOTHING;