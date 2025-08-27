import { IntentClassifier } from './classifier';
import { InformationExtractor } from './extractor';
import { SpecializedAgentFactory } from './agents/factory';
import { supabase, logSystem } from '@/lib/supabase';
import { ProjectContext } from '@/types/conversation.types';

export class BotOrchestrator {
  private classifier = new IntentClassifier();
  private extractor = new InformationExtractor();
  private agentFactory = new SpecializedAgentFactory();

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
      // 1. Load conversation with context
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

      // 2. Classify intent
      const classification = await this.classifier.classifyIntent(
        message,
        conversation.product_group,
        conversation.messages.map(m => m.content)
      );

      // 3. Update product group if changed
      if (classification.category !== conversation.product_group) {
        await supabase
          .from('conversations')
          .update({ 
            product_group: classification.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        await logSystem('info', 'BotOrchestrator', 'Product group updated', {
          conversationId,
          from: conversation.product_group,
          to: classification.category
        });
      }

      // 4. Extract information
      const extractedInfo = await this.extractor.extractFromConversation(
        [...conversation.messages, { content: message, sender_type: 'customer' }],
        conversation.project_contexts?.[0]
      );

      // 5. Update or create project context
      if (Object.keys(extractedInfo).length > 0) {
        const { id, created_at, ...contextData } = extractedInfo;
        await supabase
          .from('project_contexts')
          .upsert({
            conversation_id: conversationId,
            ...contextData,
            updated_at: new Date().toISOString()
          });

        // Update customer info in conversation
        if (extractedInfo.whatsapp_confirmed) {
          await supabase
            .from('conversations')
            .update({ 
              customer_name: conversation.customer_name || 'Cliente',
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationId);
        }
      }

      // 6. Calculate lead score
      const leadScore = this.calculateLeadScore(extractedInfo, conversation);
      const leadTemperature = this.getLeadTemperature(leadScore);

      await supabase
        .from('conversations')
        .update({ 
          lead_score: leadScore,
          lead_temperature: leadTemperature,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // 7. Get specialized agent response
      const agent = this.agentFactory.getAgent(classification.category);
      const agentResponse = await agent.generateResponse(
        message,
        {
          ...conversation,
          project_contexts: extractedInfo,
          product_group: classification.category,
          lead_score: leadScore,
          lead_temperature: leadTemperature
        }
      );

      // 8. Check if should transfer to human
      const shouldTransfer = this.shouldTransferToHuman(
        leadScore,
        conversation.messages.length,
        extractedInfo
      );

      // 9. Log the interaction
      await logSystem('info', 'BotOrchestrator', 'Message processed', {
        conversationId,
        category: classification.category,
        confidence: classification.confidence,
        leadScore,
        shouldTransfer
      });

      return {
        response: agentResponse.text,
        quickReplies: agentResponse.quickReplies,
        shouldTransferToHuman: shouldTransfer || agentResponse.shouldTransferToHuman,
        metadata: {
          classification,
          extractedInfo,
          leadScore
        }
      };

    } catch (error) {
      await logSystem('error', 'BotOrchestrator', 'Failed to process message', {
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        response: 'Desculpe, tive um problema ao processar sua mensagem. Vou chamar um atendente para ajudar você.',
        shouldTransferToHuman: true
      };
    }
  }

  private calculateLeadScore(
    context: Partial<ProjectContext>,
    conversation: any
  ): number {
    let score = 0;

    // Contact information
    if (context.whatsapp_confirmed) score += 15;
    if (conversation.customer_name) score += 10;
    if (conversation.customer_city) score += 5;

    // Project details
    if (context.energy_bill_value) score += 15;
    if (context.roof_size_m2) score += 10;
    if (context.construction_size_m2) score += 15;

    // Urgency
    if (context.urgency === 'high') score += 25;
    if (context.urgency === 'medium') score += 15;

    // Budget
    if (context.budget_range) score += 20;

    // Engagement
    const messageCount = conversation.messages?.length || 0;
    if (messageCount > 5) score += 10;
    if (messageCount > 10) score += 10;

    // Specific products
    if (context.desired_product) score += 15;
    if (context.materials_list?.length > 0) score += 10;

    return Math.min(score, 100);
  }

  private getLeadTemperature(score: number): 'cold' | 'warm' | 'hot' {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }

  private shouldTransferToHuman(
    leadScore: number,
    messageCount: number,
    context: Partial<ProjectContext>
  ): boolean {
    // Hot lead
    if (leadScore >= 80) return true;
    
    // Long conversation
    if (messageCount > 15) return true;
    
    // High urgency with contact
    if (context.urgency === 'high' && context.whatsapp_confirmed) return true;
    
    // Has budget and contact
    if (context.budget_range && context.whatsapp_confirmed) return true;

    return false;
  }
}