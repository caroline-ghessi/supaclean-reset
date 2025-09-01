import { supabase } from '@/integrations/supabase/client';
import { ProductCategory, ProjectContext } from '@/types/conversation.types';
import Handlebars from 'handlebars';

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
  whatsapp_name?: string | null;
  profile_pic_url?: string | null;
  product_group?: ProductCategory | null;
  status?: string | null;
  lead_temperature?: string | null;
  lead_score?: number | null;
  source?: string | null;
  assigned_agent_id?: string | null;
  current_agent_id?: string | null;
  confidence_score?: number | null;
  classification_updated_at?: string | null;
  buffer_until?: string | null;
  first_message_at?: string | null;
  last_message_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: any;
  project_contexts?: Partial<ProjectContext>;
  messages?: Array<{ content: string; sender_type: string; created_at: string }>;
}

export class DynamicAgentService {
  private promptCache = new Map<string, any>();

  async getAgentResponse(
    category: ProductCategory,
    message: string,
    context: ConversationWithContext
  ): Promise<AgentResponse> {
    try {
      // Load active prompt for category from /bot configuration
      const agentConfig = await this.loadAgentPrompt(category);
      
      if (!agentConfig || !agentConfig.knowledge_base) {
        return this.getDefaultResponse();
      }

      // Get relevant knowledge using RAG
      const relevantKnowledge = await this.getRelevantKnowledge(message, category);
      
      // Add knowledge to context
      const enhancedContext = {
        ...context,
        relevantKnowledge
      };

      // Process template with enhanced context
      const processedPrompt = this.processTemplate(
        agentConfig.knowledge_base,
        enhancedContext
      );

      return {
        text: processedPrompt,
        quickReplies: [],
        metadata: {
          agentType: agentConfig.agent_type || 'specialist',
          knowledgeUsed: relevantKnowledge ? true : false
        }
      };
    } catch (error) {
      console.error('Error in DynamicAgentService:', error);
      return this.getDefaultResponse();
    }
  }

  private async loadAgentPrompt(category: ProductCategory) {
    // Check cache first
    const cacheKey = `prompt_${category}`;
    if (this.promptCache.has(cacheKey)) {
      return this.promptCache.get(cacheKey);
    }

    // Load from agent_prompts table (configured in /bot agentes tab)
    const { data } = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('category', category as any) // Type will be updated after DB sync
      .eq('is_active', true)
      .single();

    // Fallback to general agent if no specialist found
    if (!data) {
      const { data: generalAgent } = await supabase
        .from('agent_prompts')
        .select('*')
        .eq('category', 'geral' as any) // Type will be updated after DB sync
        .eq('is_active', true)
        .single();
      
      if (generalAgent) {
        this.promptCache.set(cacheKey, generalAgent);
        setTimeout(() => this.promptCache.delete(cacheKey), 5 * 60 * 1000);
      }
      
      return generalAgent;
    }

    // Cache for 5 minutes
    this.promptCache.set(cacheKey, data);
    setTimeout(() => this.promptCache.delete(cacheKey), 5 * 60 * 1000);

    return data;
  }


  private processTemplate(template: string, context: ConversationWithContext & { relevantKnowledge?: string }) {
    // Register Handlebars helpers
    Handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    Handlebars.registerHelper('hasKnowledge', function(knowledge) {
      return knowledge && knowledge.trim().length > 0;
    });

    // Compile Handlebars template
    const compiledTemplate = Handlebars.compile(template);

    // Prepare context with all possible variables
    const templateContext = {
      // Customer info
      customer_name: context.customer_name || 'amigo',
      whatsapp_number: context.whatsapp_number,
      customer_city: context.customer_city,
      customer_state: context.customer_state,
      
      // Project info
      ...context.project_contexts,
      
      // RAG Knowledge
      relevantKnowledge: context.relevantKnowledge || '',
      
      // System info
      product_group: this.translateProductGroup(context.product_group as ProductCategory),
      lead_score: context.lead_score,
      lead_temperature: this.translateTemperature(context.lead_temperature),
      current_date: new Date().toLocaleDateString('pt-BR'),
      current_time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      
      // Calculations
      energy_savings: context.project_contexts?.energy_bill_value 
        ? Math.round(Number(context.project_contexts.energy_bill_value) * 0.9)
        : 0,
      roof_telhas_qtd: context.project_contexts?.roof_size_m2
        ? Math.ceil(Number(context.project_contexts.roof_size_m2) / 1.5)
        : 0,
      steel_time_months: context.project_contexts?.construction_size_m2
        ? Math.round(Number(context.project_contexts.construction_size_m2) / 100)
        : 0
    };

    // Process template
    return compiledTemplate(templateContext);
  }

  private translateProductGroup(group?: ProductCategory): string {
    if (!group) return 'Produto';
    
    const translations = {
      energia_solar: 'Energia Solar',
      telha_shingle: 'Telhas Shingle',
      steel_frame: 'Steel Frame',
      drywall_divisorias: 'Drywall e Divisórias',
      ferramentas: 'Ferramentas',
      pisos: 'Pisos',
      acabamentos: 'Acabamentos',
      forros: 'Forros',
      saudacao: 'Saudação',
      institucional: 'Institucional',
      indefinido: 'Indefinido'
    };
    
    return translations[group] || group;
  }

  private translateTemperature(temp?: string): string {
    if (!temp) return 'Neutro';
    
    const translations = {
      cold: '❄️ Frio',
      warm: '🔥 Morno',
      hot: '🔥🔥 Quente'
    };
    
    return translations[temp] || temp;
  }

  private getDefaultResponse(): AgentResponse {
    return {
      text: `Desculpe, não consegui processar sua mensagem. Vou conectar você com um atendente.`,
      shouldTransferToHuman: true,
      metadata: { shouldTransfer: true }
    };
  }

  private getFinalResponse(context: ConversationWithContext): AgentResponse {
    return {
      text: `Vou conectar você com um atendente especializado.`,
      shouldTransferToHuman: true,
      metadata: { 
        qualified: true,
        shouldTransfer: true 
      }
    };
  }

  // Method to test prompts in admin
  async testPrompt(
    agentPromptId: string,
    message: string,
    testContext: any
  ): Promise<any> {
    const { data: agentPrompt } = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('id', agentPromptId)
      .single();

    if (!agentPrompt) {
      throw new Error('Agent prompt not found');
    }

    const processedPrompt = this.processTemplate(
      agentPrompt.knowledge_base || '',
      testContext
    );

    return {
      response: processedPrompt,
      metadata: {
        agentType: agentPrompt.agent_type || 'specialist',
        contextUsed: testContext
      }
    };
  }

  private async getRelevantKnowledge(message: string, category: ProductCategory): Promise<string> {
    try {
      // Generate embedding for the message
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          content: message,
          generateChunks: false
        }
      });

      if (embeddingError || !embeddingData?.embedding) {
        console.warn('Failed to generate embedding for knowledge search:', embeddingError);
        return '';
      }

      // Search for relevant knowledge chunks
      const { data: chunks, error: searchError } = await supabase.rpc('search_knowledge_chunks', {
        query_embedding: embeddingData.embedding,
        target_agent_category: category as any, // Type will be updated after DB sync
        similarity_threshold: 0.7,
        max_results: 3
      });

      if (searchError) {
        console.warn('Knowledge search failed:', searchError);
        return '';
      }

      if (!chunks || chunks.length === 0) {
        return '';
      }

      // Format knowledge for inclusion in prompt
      const formattedKnowledge = chunks
        .map((chunk: any, index: number) => 
          `[Fonte ${index + 1}: ${chunk.file_name}]\n${chunk.content}`
        )
        .join('\n\n---\n\n');

      return formattedKnowledge;
    } catch (error) {
      console.error('Error getting relevant knowledge:', error);
      return '';
    }
  }

  // Clear cache (useful for admin when prompts are updated)
  clearCache() {
    this.promptCache.clear();
  }
}

// Export singleton instance
export const dynamicAgentService = new DynamicAgentService();