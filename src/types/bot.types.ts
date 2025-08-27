// Tipos específicos para o sistema de bot inteligente Drystore

export interface BotClassificationResult {
  category: ProductCategory;
  confidence: number;
  intent: string;
  entities: Record<string, any>;
  suggestions: string[];
}

export interface BotExtractionResult {
  field: string;
  value: any;
  confidence: number;
  source: string;
}

export interface BotConversationState {
  conversation_id: string;
  current_flow: string;
  last_intent: string;
  collected_data: Record<string, any>;
  pending_questions: string[];
  completion_status: number; // 0-100%
  next_action: string;
}

export interface BotConfiguration {
  enabled: boolean;
  default_language: string;
  confidence_threshold: number;
  escalation_triggers: string[];
  working_hours: {
    start: string;
    end: string;
    timezone: string;
  };
  templates: {
    greeting: string;
    fallback: string;
    escalation: string;
    closing: string;
  };
}

export interface ProductFlow {
  category: ProductCategory;
  steps: FlowStep[];
  completion_criteria: string[];
}

export interface FlowStep {
  id: string;
  name: string;
  question: string;
  type: 'text' | 'number' | 'choice' | 'boolean';
  options?: string[];
  validation?: ValidationRule;
  next_step?: string | ConditionalStep[];
  data_field: string;
}

export interface ConditionalStep {
  condition: string;
  next_step: string;
}

export interface ValidationRule {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  min_value?: number;
  max_value?: number;
}

export interface BotMetrics {
  total_interactions: number;
  successful_classifications: number;
  escalations: number;
  completion_rate: number;
  average_response_time: number;
  user_satisfaction: number;
}

export type ProductCategory =
  | 'telha_shingle'
  | 'energia_solar'
  | 'steel_frame'
  | 'drywall_divisorias'
  | 'ferramentas'
  | 'pisos'
  | 'acabamentos'
  | 'forros'
  | 'saudacao'
  | 'institucional'
  | 'indefinido';

// Constantes para categorização
export const PRODUCT_KEYWORDS = {
  telha_shingle: [
    'telha', 'shingle', 'telhado', 'cobertura', 'reforma telhado',
    'vazamento', 'troca telha', 'telhamento'
  ],
  energia_solar: [
    'energia solar', 'painel solar', 'fotovoltaico', 'conta de luz',
    'economia energia', 'solar', 'energia limpa', 'sustentável'
  ],
  steel_frame: [
    'steel frame', 'estrutura metalica', 'casa metalica', 
    'construção rapida', 'obra rapida', 'estrutura aço'
  ],
  drywall_divisorias: [
    'drywall', 'divisoria', 'parede', 'gesso', 'separação ambiente',
    'divisão', 'reforma interna'
  ],
  ferramentas: [
    'ferramenta', 'equipamento', 'broca', 'parafuso', 'martelo',
    'chave', 'furadeira', 'serra'
  ],
  pisos: [
    'piso', 'ceramica', 'porcelanato', 'laminado', 'vinyl',
    'assoalho', 'revestimento chão', 'piso vinilico'
  ],
  acabamentos: [
    'acabamento', 'tinta', 'verniz', 'massa corrida', 'gesso',
    'textura', 'pintura', 'revestimento'
  ],
  forros: [
    'forro', 'teto', 'pvc', 'gesso', 'madeira', 'teto falso',
    'rebaixamento', 'forro modular'
  ]
} as const;

export const INTENT_PATTERNS = {
  greeting: [
    'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'olá',
    'ei', 'hello', 'hey'
  ],
  price_inquiry: [
    'preço', 'valor', 'quanto custa', 'orçamento', 'cotação',
    'custo', 'investimento', 'quanto fica'
  ],
  information_request: [
    'informação', 'duvida', 'como funciona', 'detalhes',
    'especificação', 'caracteristica', 'info'
  ],
  purchase_intent: [
    'comprar', 'adquirir', 'quero', 'preciso', 'interesse',
    'gostaria', 'fechamento', 'pedido'
  ],
  technical_support: [
    'problema', 'defeito', 'suporte', 'ajuda', 'não funciona',
    'quebrou', 'manutenção', 'assistencia'
  ]
} as const;