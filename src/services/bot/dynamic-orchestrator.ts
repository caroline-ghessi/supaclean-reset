import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/conversation.types';

export class DynamicBotOrchestrator {
  async processMessage(
    conversationId: string,
    message: string
  ): Promise<{
    response: string;
    quickReplies?: string[];
    shouldTransferToHuman?: boolean;
    metadata?: Record<string, any>;
  }> {
    try {
      // 1. Load system configurations
      const { data: configs } = await supabase
        .from('system_configs')
        .select('*')
        .in('key', [
          'master_agent_welcome_message',
          'master_agent_fallback_message',
          'master_agent_min_confidence',
          'master_agent_buffer_time'
        ]);

      const configMap = configs?.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, any>) || {};

      // 2. Load conversation with context
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          *,
          project_contexts (*),
          messages (
            content,
            sender_type,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // 3. Classify intent using dynamic keywords
      const classification = await this.classifyIntentDynamic(
        message,
        conversation.product_group,
        conversation.messages.map(m => m.content)
      );

      // 4. Log classification
      await supabase.from('classification_logs').insert({
        conversation_id: conversationId,
        message_text: message,
        classified_category: classification.category,
        confidence_score: classification.confidence,
        status: classification.confidence >= (configMap.master_agent_min_confidence || 0.7) ? 'success' : 'low_confidence',
        processing_time_ms: Date.now() - Date.now(), // Placeholder
        metadata: { entities: classification.entities }
      });

      // 5. Update conversation category if changed
      if (classification.category !== conversation.product_group) {
        await supabase
          .from('conversations')
          .update({ 
            product_group: classification.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }

      // 6. Generate response based on classification
      const response = await this.generateResponse(
        message,
        classification,
        conversation,
        configMap
      );

      return response;

    } catch (error) {
      console.error('Error in dynamic orchestrator:', error);
      return {
        response: 'Desculpe, tive um problema ao processar sua mensagem. Vou chamar um atendente para ajudar você.',
        shouldTransferToHuman: true
      };
    }
  }

  private async classifyIntentDynamic(
    message: string,
    currentCategory: ProductCategory | null,
    conversationHistory: string[]
  ): Promise<{
    category: ProductCategory;
    confidence: number;
    entities: Record<string, any>;
  }> {
    // Load dynamic keywords
    const { data: keywords } = await supabase
      .from('classification_keywords')
      .select('*')
      .eq('is_active', true);

    const normalizedMessage = this.normalizeText(message);
    const scores = new Map<ProductCategory, number>();

    // Calculate scores based on dynamic keywords
    for (const keywordData of keywords || []) {
      const category = keywordData.category as ProductCategory;
      const keyword = this.normalizeText(keywordData.keyword);
      const weight = keywordData.weight || 5;

      if (!scores.has(category)) {
        scores.set(category, 0);
      }

      if (normalizedMessage.includes(keyword)) {
        scores.set(category, scores.get(category)! + weight);
      }
    }

    // Find top category
    let topCategory: ProductCategory = 'indefinido';
    let maxScore = 0;

    scores.forEach((score, category) => {
      if (score > maxScore) {
        maxScore = score;
        topCategory = category;
      }
    });

    // Calculate confidence
    const confidence = Math.min(maxScore / 20, 1);

    // If current category exists and no clear change detected, maintain it
    if (currentCategory && 
        !['saudacao', 'institucional', 'indefinido'].includes(currentCategory) &&
        confidence < 0.8) {
      return {
        category: currentCategory,
        confidence: 0.95,
        entities: this.extractEntities(message)
      };
    }

    return {
      category: topCategory,
      confidence: confidence > 0.3 ? confidence : 0.3,
      entities: this.extractEntities(message)
    };
  }

  private async generateResponse(
    message: string,
    classification: any,
    conversation: any,
    configs: Record<string, any>
  ) {
    const messageCount = conversation.messages?.length || 0;
    const lowerMessage = message.toLowerCase();

    // Check if first message (greeting)
    if (messageCount === 0 || 
        lowerMessage.includes('oi') || 
        lowerMessage.includes('olá') || 
        lowerMessage.includes('ola')) {
      
      const welcomeMessage = configs.master_agent_welcome_message || 
        `Olá! 😊 Bem-vindo à Drystore!\n\nSou o assistente virtual e estou aqui para ajudar você a encontrar a melhor solução.\n\n**Como posso ajudar hoje?**`;
      
      return {
        response: welcomeMessage,
        quickReplies: ['☀️ Energia Solar', '🏠 Telhas Shingle', '🔧 Ferramentas', '🏗️ Steel Frame'],
        shouldTransferToHuman: false
      };
    }

    // Check if low confidence classification
    const minConfidence = configs.master_agent_min_confidence || 0.7;
    if (classification.confidence < minConfidence) {
      const fallbackMessage = configs.master_agent_fallback_message ||
        `Entendi sua mensagem!\n\nPara melhor atendimento, você pode:\n- Escolher uma das opções abaixo\n- Pedir para falar com um especialista\n\n**Principais áreas que atendemos:**`;
      
      return {
        response: fallbackMessage,
        quickReplies: ['Energia Solar', 'Telhas', 'Steel Frame', 'Falar com especialista'],
        shouldTransferToHuman: messageCount > 3
      };
    }

    // Category-specific responses (simplified)
    switch (classification.category) {
      case 'energia_solar':
        return {
          response: `☀️ Ótimo interesse em energia solar!\n\nSomos **parceiros exclusivos GE no Sul do Brasil** 🏆\n\nOferecemos:\n⚡ Sistemas completos de geração\n🔋 Baterias para nunca ficar sem luz\n📊 Redução de até 95% na conta\n✅ 25 anos de garantia nos painéis\n\nPara dimensionar o sistema ideal para você:\n**Qual o valor médio da sua conta de luz?**`,
          quickReplies: ['Até R$ 200', 'R$ 200-500', 'R$ 500-1000', 'Acima de R$ 1000']
        };
      
      case 'telha_shingle':
        return {
          response: `🏠 Excelente escolha pelas telhas shingle!\n\nTrabalhamos com **Owens Corning** dos EUA - a melhor do mercado, com:\n✅ 50 anos de garantia (documento oficial)\n✅ Resistência a ventos de 130 mph\n✅ Tecnologia SureNail exclusiva\n✅ 30+ opções de cores\n\nPara preparar o melhor orçamento, preciso saber:\n**Sua obra é uma construção nova ou reforma de telhado existente?**`,
          quickReplies: ['Construção Nova', 'Reforma', 'Ainda não decidi']
        };
      
      default:
        const fallbackMessage = configs.master_agent_fallback_message ||
          `Entendi sua mensagem!\n\nPara melhor atendimento, você pode:\n- Escolher uma das opções abaixo\n- Pedir para falar com um especialista\n\n**Principais áreas que atendemos:**`;
        
        return {
          response: fallbackMessage,
          quickReplies: ['Energia Solar', 'Telhas', 'Steel Frame', 'Falar com especialista'],
          shouldTransferToHuman: messageCount > 5
        };
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract urgency
    if (/urgente|hoje|agora|rápido|imediato|emergência/i.test(message)) {
      entities.urgency = 'high';
    }

    // Extract budget intent
    if (/preço|valor|quanto|orçamento|custo|investimento/i.test(message)) {
      entities.wantsBudget = true;
    }

    // Extract phone numbers
    const phoneRegex = /(\(?\d{2}\)?\s?9?\d{4}-?\d{4})/g;
    const phones = message.match(phoneRegex);
    if (phones) {
      entities.phone = phones[0];
    }

    // Extract email
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = message.match(emailRegex);
    if (emails) {
      entities.email = emails[0];
    }

    return entities;
  }
}

export const dynamicBotOrchestrator = new DynamicBotOrchestrator();