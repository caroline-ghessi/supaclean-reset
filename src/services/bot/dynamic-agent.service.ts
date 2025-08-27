import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/conversation.types';
import { ConversationWithContext, AgentResponse } from './agents/base-agent';
import Handlebars from 'handlebars';

export class DynamicAgentService {
  private promptCache = new Map<string, any>();

  async getAgentResponse(
    category: ProductCategory,
    message: string,
    context: ConversationWithContext
  ): Promise<AgentResponse> {
    try {
      // 1. Load active prompt for category
      const agentPrompt = await this.loadAgentPrompt(category);
      
      if (!agentPrompt) {
        return this.getDefaultResponse();
      }

      // 2. Load steps for this agent
      const steps = await this.loadPromptSteps(agentPrompt.id);
      
      // 3. Find appropriate step based on context
      const currentStep = this.selectStep(steps, context);
      
      if (!currentStep) {
        return this.getFinalResponse(context);
      }

      // 4. Process template with context
      const processedPrompt = this.processTemplate(
        currentStep.prompt_template,
        context
      );

      return {
        text: processedPrompt,
        quickReplies: currentStep.quick_replies || [],
        metadata: {
          stepKey: currentStep.step_key,
          nextStep: currentStep.next_step
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

    // Load from database
    const { data } = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    // Cache for 5 minutes
    if (data) {
      this.promptCache.set(cacheKey, data);
      setTimeout(() => this.promptCache.delete(cacheKey), 5 * 60 * 1000);
    }

    return data;
  }

  private async loadPromptSteps(agentPromptId: string) {
    const { data } = await supabase
      .from('agent_prompt_steps')
      .select('*')
      .eq('agent_prompt_id', agentPromptId)
      .order('step_order', { ascending: true });

    return data || [];
  }

  private selectStep(steps: any[], context: ConversationWithContext) {
    // Find first step where condition is not met
    for (const step of steps) {
      if (!step.condition_field) {
        // Step always executes
        return step;
      }

      // Check if condition field is empty
      const fieldValue = this.getContextValue(context, step.condition_field);
      if (!fieldValue) {
        return step;
      }
    }

    return null; // All steps completed
  }

  private getContextValue(context: ConversationWithContext, fieldPath: string) {
    // Navigate nested object path like 'project_contexts.energy_consumption'
    const parts = fieldPath.split('.');
    let value: any = context;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    
    return value;
  }

  private processTemplate(template: string, context: ConversationWithContext) {
    // Register Handlebars helpers
    Handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
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
      text: `Desculpe, estou com dificuldades para processar sua mensagem.

Vou transferir você para um especialista que pode ajudar melhor.

Por favor, aguarde um momento. 🙏`,
      shouldTransferToHuman: true,
      metadata: { shouldTransfer: true }
    };
  }

  private getFinalResponse(context: ConversationWithContext): AgentResponse {
    return {
      text: `Perfeito! Já tenho todas as informações necessárias.

**Resumo do seu interesse:**
- Produto: ${this.translateProductGroup(context.product_group as ProductCategory)}
- Lead Score: ${context.lead_score}/100
- Qualificação: ${this.translateTemperature(context.lead_temperature)}

Um especialista entrará em contato em breve para finalizar seu atendimento.

Muito obrigado! 🤝`,
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

    const steps = await this.loadPromptSteps(agentPromptId);
    const currentStep = this.selectStep(steps, testContext);

    if (!currentStep) {
      return this.getFinalResponse(testContext);
    }

    const processedPrompt = this.processTemplate(
      currentStep.prompt_template,
      testContext
    );

    return {
      response: processedPrompt,
      quickReplies: currentStep.quick_replies,
      metadata: {
        stepUsed: currentStep.step_key,
        nextStep: currentStep.next_step,
        contextUsed: testContext
      }
    };
  }

  // Clear cache (useful for admin when prompts are updated)
  clearCache() {
    this.promptCache.clear();
  }
}

// Export singleton instance
export const dynamicAgentService = new DynamicAgentService();