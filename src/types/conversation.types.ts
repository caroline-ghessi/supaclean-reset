// Tipos principais do sistema Drystore
export interface Conversation {
  id: string;
  whatsapp_number: string;
  whatsapp_name?: string;
  customer_name?: string;
  customer_email?: string;
  customer_city?: string;
  customer_state?: string;
  product_group: ProductCategory;
  status: ConversationStatus;
  lead_temperature: LeadTemperature;
  lead_score: number;
  assigned_agent_id?: string;
  first_message_at: Date;
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_name?: string;
  content: string;
  media_url?: string;
  media_type?: string;
  transcription?: string;
  transcription_status?: string;
  is_read: boolean;
  delivered_at?: Date;
  read_at?: Date;
  created_at: Date;
  metadata: Record<string, any>;
}

export interface ProjectContext {
  id: string;
  conversation_id: string;
  whatsapp_confirmed?: string;
  
  // Energia solar
  energy_consumption?: string;
  energy_bill_value?: number;
  has_energy_backups?: boolean;
  
  // Telhas
  roof_status?: 'nova_construcao' | 'reforma';
  roof_size_m2?: number;
  
  // Steel frame
  has_architectural_project?: boolean;
  project_status?: string;
  construction_size_m2?: number;
  
  // Pisos
  floor_quantity_m2?: number;
  floor_rooms?: string;
  
  // Geral
  materials_list?: string[];
  desired_product?: string;
  urgency?: 'low' | 'medium' | 'high';
  budget_range?: string;
  timeline?: string;
  notes?: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface BotTemplate {
  id: string;
  category: ProductCategory;
  intent: string;
  language: string;
  template_text: string;
  quick_replies?: any;
  next_intents?: string[];
  is_active: boolean;
  created_at: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  updated_at: Date;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
  created_at: Date;
}

// Enums tipados
export type ConversationStatus =
  | 'waiting'
  | 'active'
  | 'in_bot'
  | 'with_agent'
  | 'qualified'
  | 'transferred'
  | 'closed';

export type SenderType = 'customer' | 'bot' | 'agent' | 'system';

export type LeadTemperature = 'cold' | 'warm' | 'hot';

export type ProductCategory =
  | 'geral'
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

// Tipos para UI
export interface ConversationWithLastMessage extends Conversation {
  lastMessage?: Message;
  unreadCount: number;
}

export interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  hotLeads: number;
  todayMessages: number;
  responseTime: number;
  conversionRate: number;
}

// Tipos para filtros
export interface ConversationFilters {
  status?: ConversationStatus[];
  product_group?: ProductCategory[];
  lead_temperature?: LeadTemperature[];
  date_range?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Tipos para bot
export interface BotIntent {
  name: string;
  description: string;
  examples: string[];
  actions: string[];
}

export interface BotResponse {
  text: string;
  quick_replies?: string[];
  next_step?: string;
  data_extraction?: Record<string, any>;
}