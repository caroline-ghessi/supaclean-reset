-- Add tables for managing agent prompts
CREATE TABLE agent_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category product_category NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  
  UNIQUE(category, is_active)
);

-- Table for agent prompt steps/intents
CREATE TABLE agent_prompt_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_prompt_id UUID REFERENCES agent_prompts(id) ON DELETE CASCADE,
  step_key VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  condition_field VARCHAR(100), -- context field that should be empty
  prompt_template TEXT NOT NULL,
  quick_replies JSONB,
  next_step VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(agent_prompt_id, step_key)
);

-- Table for available variables/placeholders
CREATE TABLE prompt_variables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variable_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  example_value TEXT,
  category VARCHAR(50) -- 'customer', 'project', 'system'
);

-- History table for prompt versions
CREATE TABLE agent_prompt_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_prompt_id UUID REFERENCES agent_prompts(id),
  version INTEGER NOT NULL,
  prompt_data JSONB NOT NULL,
  changed_by VARCHAR(255),
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompt_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompt_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON agent_prompts FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON agent_prompt_steps FOR ALL USING (true);
CREATE POLICY "Enable read for prompt variables" ON prompt_variables FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users" ON agent_prompt_history FOR ALL USING (true);

-- Populate available variables
INSERT INTO prompt_variables (variable_name, description, example_value, category) VALUES
('{{customer_name}}', 'Nome do cliente', 'João Silva', 'customer'),
('{{whatsapp_number}}', 'WhatsApp do cliente', '51999887766', 'customer'),
('{{customer_city}}', 'Cidade do cliente', 'Porto Alegre', 'customer'),
('{{customer_state}}', 'Estado do cliente', 'RS', 'customer'),
('{{product_group}}', 'Categoria do produto', 'energia_solar', 'project'),
('{{energy_consumption}}', 'Consumo de energia', '500 kWh', 'project'),
('{{energy_bill_value}}', 'Valor da conta de luz', '450', 'project'),
('{{roof_status}}', 'Status do telhado', 'reforma', 'project'),
('{{roof_size_m2}}', 'Tamanho do telhado em m²', '150', 'project'),
('{{construction_size_m2}}', 'Tamanho da construção em m²', '250', 'project'),
('{{has_energy_backups}}', 'Tem interesse em baterias', 'true', 'project'),
('{{urgency}}', 'Urgência do projeto', 'high', 'project'),
('{{budget_range}}', 'Faixa de orçamento', 'R$ 50.000 - R$ 80.000', 'project'),
('{{lead_score}}', 'Score do lead', '85', 'system'),
('{{lead_temperature}}', 'Temperatura do lead', 'hot', 'system'),
('{{current_date}}', 'Data atual', '15/01/2025', 'system'),
('{{current_time}}', 'Hora atual', '14:30', 'system'),
('{{energy_savings}}', 'Economia estimada energia', '405', 'calculated'),
('{{roof_telhas_qtd}}', 'Quantidade de telhas', '100', 'calculated'),
('{{steel_time_months}}', 'Tempo Steel Frame em meses', '3', 'calculated');

-- Insert default agent prompts
INSERT INTO agent_prompts (category, name, description, is_active) VALUES
('energia_solar', 'Agente Energia Solar', 'Agente especializado em sistemas de energia solar', true),
('telha_shingle', 'Agente Telha Shingle', 'Agente especializado em telhas shingle Owens Corning', true),
('steel_frame', 'Agente Steel Frame', 'Agente especializado em construção Steel Frame', true),
('drywall_divisorias', 'Agente Drywall', 'Agente especializado em drywall e divisórias', true),
('ferramentas', 'Agente Ferramentas', 'Agente especializado em ferramentas profissionais', true),
('pisos', 'Agente Pisos', 'Agente especializado em pisos e revestimentos', true),
('acabamentos', 'Agente Acabamentos', 'Agente especializado em acabamentos e tintas', true),
('forros', 'Agente Forros', 'Agente especializado em forros', true),
('saudacao', 'Agente Saudação', 'Agente para mensagens de boas-vindas', true),
('institucional', 'Agente Institucional', 'Agente para informações da empresa', true);

-- Create update trigger
CREATE TRIGGER update_agent_prompts_updated_at
BEFORE UPDATE ON agent_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();