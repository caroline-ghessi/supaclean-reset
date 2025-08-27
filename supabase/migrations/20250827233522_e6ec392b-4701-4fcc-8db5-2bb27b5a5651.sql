-- Create table for managing classification keywords dynamically
CREATE TABLE public.classification_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  keyword TEXT NOT NULL,
  weight INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for classification logs
CREATE TABLE public.classification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID,
  message_text TEXT NOT NULL,
  classified_category TEXT,
  confidence_score NUMERIC(5,2),
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'success',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for custom classification rules
CREATE TABLE public.classification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  condition_field TEXT NOT NULL,
  condition_operator TEXT NOT NULL,
  condition_value TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classification_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all for authenticated users" ON public.classification_keywords FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.classification_logs FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.classification_rules FOR ALL USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_classification_keywords_updated_at
  BEFORE UPDATE ON public.classification_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classification_rules_updated_at
  BEFORE UPDATE ON public.classification_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default keywords
INSERT INTO public.classification_keywords (category, keyword, weight) VALUES
('energia_solar', 'solar', 10),
('energia_solar', 'energia', 8),
('energia_solar', 'painel', 9),
('energia_solar', 'painéis', 9),
('energia_solar', 'bateria', 7),
('energia_solar', 'backup', 6),
('energia_solar', 'inversor', 8),
('energia_solar', 'conta de luz', 10),
('energia_solar', 'energia limpa', 9),
('energia_solar', 'fotovoltaico', 10),
('energia_solar', 'kwp', 8),
('energia_solar', 'geração', 7),

('telha_shingle', 'telha', 10),
('telha_shingle', 'telhado', 9),
('telha_shingle', 'shingle', 10),
('telha_shingle', 'cobertura', 8),
('telha_shingle', 'telhado dos sonhos', 9),
('telha_shingle', 'owens corning', 10),
('telha_shingle', 'iko', 10),
('telha_shingle', 'reforma telhado', 9),

('steel_frame', 'steel frame', 10),
('steel_frame', 'steel', 8),
('steel_frame', 'estrutura metálica', 9),
('steel_frame', 'construção seca', 8),
('steel_frame', 'estrutura de aço', 9),
('steel_frame', 'lsf', 10),
('steel_frame', 'light steel', 10),

('drywall_divisorias', 'drywall', 10),
('drywall_divisorias', 'dry wall', 10),
('drywall_divisorias', 'placa', 6),
('drywall_divisorias', 'chapa', 6),
('drywall_divisorias', 'divisória', 8),
('drywall_divisorias', 'parede', 7),
('drywall_divisorias', 'gesso', 7),
('drywall_divisorias', 'acartonado', 8),
('drywall_divisorias', 'knauf', 9),
('drywall_divisorias', 'placo', 9),

('ferramentas', 'furadeira', 8),
('ferramentas', 'parafusadeira', 8),
('ferramentas', 'makita', 9),
('ferramentas', 'dewalt', 9),
('ferramentas', 'serra', 7),
('ferramentas', 'ferramenta', 10),
('ferramentas', 'máquina', 6),
('ferramentas', 'esmerilhadeira', 8),
('ferramentas', 'lixadeira', 8),
('ferramentas', 'martelete', 8),
('ferramentas', 'kit ferramenta', 9),

('pisos', 'piso', 10),
('pisos', 'vinílico', 8),
('pisos', 'laminado', 8),
('pisos', 'carpete', 7),
('pisos', 'manta', 6),
('pisos', 'rodapé', 7),
('pisos', 'porcelanato', 8),
('pisos', 'cerâmica', 7),
('pisos', 'revestimento', 7),

('acabamentos', 'tinta', 8),
('acabamentos', 'textura', 7),
('acabamentos', 'massa corrida', 8),
('acabamentos', 'selador', 7),
('acabamentos', 'verniz', 7),
('acabamentos', 'santa luzia', 9),
('acabamentos', 'acabamento', 10),

('forros', 'forro', 10),
('forros', 'gesso', 8),
('forros', 'pvc', 7),
('forros', 'modular', 6),
('forros', 'rebaixamento', 8),

('saudacao', 'oi', 10),
('saudacao', 'olá', 10),
('saudacao', 'ola', 10),
('saudacao', 'bom dia', 10),
('saudacao', 'boa tarde', 10),
('saudacao', 'boa noite', 10),
('saudacao', 'hello', 8),
('saudacao', 'hey', 8),
('saudacao', 'opa', 9),
('saudacao', 'e aí', 9),

('institucional', 'onde fica', 9),
('institucional', 'endereço', 10),
('institucional', 'localização', 9),
('institucional', 'horário', 9),
('institucional', 'telefone', 8),
('institucional', 'quem são', 8),
('institucional', 'sobre a empresa', 9),
('institucional', 'drystore', 10),
('institucional', 'contato', 8),
('institucional', 'whatsapp', 7);

-- Insert default rules
INSERT INTO public.classification_rules (name, condition_field, condition_operator, condition_value, action_type, action_value, priority) VALUES
('Urgência detectada', 'message_text', 'contains_any', 'urgente,hoje,agora,rápido,imediato,emergência', 'increase_score', '20', 1),
('Cliente recorrente', 'customer_type', 'equals', 'returning', 'skip_classification', 'use_last_agent', 2),
('Valor alto mencionado', 'message_text', 'contains_pattern', '\d+\.?\d*\s*(mil|k|reais|R\$)', 'mark_as', 'hot_lead', 3),
('Orçamento solicitado', 'message_text', 'contains_any', 'preço,valor,quanto,orçamento,custo,investimento', 'set_flag', 'wants_budget', 4),
('Projeto grande', 'message_text', 'contains_any', 'obra,construção,prédio,condomínio,empresarial', 'set_flag', 'large_project', 5);

-- Insert system configs for master agent
INSERT INTO public.system_configs (key, value, description) VALUES
('master_agent_welcome_message', '"Olá! 👋 Seja bem-vindo à Drystore!\n\nSou o assistente virtual e estou aqui para ajudar você a encontrar a solução ideal.\n\nComo posso ajudar hoje?\n\n🔸 Energia Solar\n🔸 Telhas e Coberturas\n🔸 Construção (Steel Frame/Drywall)\n🔸 Ferramentas Profissionais\n🔸 Falar com um especialista"', 'Mensagem de boas-vindas do agente master'),
('master_agent_fallback_message', '"Desculpe, não entendi completamente.\n\nPor favor, escolha uma das opções abaixo ou descreva melhor o que procura:"', 'Mensagem quando não consegue classificar'),
('master_agent_buffer_time', '60', 'Tempo de espera em segundos para classificar'),
('master_agent_min_confidence', '70', 'Confiança mínima para roteamento automático'),
('master_agent_collect_name', 'true', 'Coletar nome automaticamente'),
('master_agent_show_buttons', 'true', 'Mostrar opções em botões'),
('master_agent_multi_category', 'false', 'Permitir múltiplas categorias');