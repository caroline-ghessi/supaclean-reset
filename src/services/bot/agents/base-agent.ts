import { Conversation, ProjectContext } from '@/types/conversation.types';

export interface AgentResponse {
  text: string;
  quickReplies?: string[];
  shouldTransferToHuman?: boolean;
  metadata?: Record<string, any>;
}

export interface ConversationWithContext {
  id: string;
  whatsapp_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  product_group?: string | null;
  status?: string | null;
  lead_temperature?: string | null;
  lead_score?: number | null;
  assigned_agent_id?: string | null;
  first_message_at?: string | null;
  last_message_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: any;
  project_contexts?: Partial<ProjectContext>;
  messages?: Array<{ content: string; sender_type: string; created_at: string }>;
}

export abstract class BaseAgent {
  protected companyInfo = {
    name: 'Drystore',
    phone: '(51) 99999-0000',
    address: 'Porto Alegre, RS',
    website: 'www.drystore.com.br',
    specialties: [
      'Energia Solar - Parceiro GE',
      'Telhas Shingle - Telhado dos Sonhos',
      'Steel Frame - Construção Seca',
      'Drywall - Divisórias e Forros',
      'Ferramentas Profissionais',
      'Pisos e Acabamentos'
    ]
  };

  abstract generateResponse(
    message: string,
    conversationData: ConversationWithContext
  ): Promise<AgentResponse>;

  protected getGreeting(timeOfDay?: string): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Quick replies removidas - agora conversação é apenas texto natural
  protected generateQuickReplies(context: string[]): string[] {
    return []; // Não usar mais quick replies
  }

  protected shouldEscalateToHuman(
    messageCount: number,
    hasUrgency: boolean,
    hasContact: boolean,
    leadScore: number
  ): boolean {
    // High lead score
    if (leadScore >= 80) return true;
    
    // Multiple interactions with urgency
    if (messageCount > 5 && hasUrgency) return true;
    
    // Has contact and wants budget
    if (hasContact && leadScore >= 60) return true;
    
    // Long conversation
    if (messageCount > 12) return true;

    return false;
  }

  protected extractContextualInfo(message: string): {
    hasUrgency: boolean;
    wantsContact: boolean;
    wantsBudget: boolean;
    mentionedCompetitor: boolean;
  } {
    const lowerMessage = message.toLowerCase();
    
    return {
      hasUrgency: /urgente|hoje|agora|rápido|imediato/.test(lowerMessage),
      wantsContact: /contato|telefone|ligar|falar|atendente/.test(lowerMessage),
      wantsBudget: /preço|valor|quanto|orçamento|custo/.test(lowerMessage),
      mentionedCompetitor: /concorrente|outro|empresa|comparar/.test(lowerMessage)
    };
  }
}