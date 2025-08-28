import { supabase } from '@/lib/supabase';
import { dynamicAgentService } from '@/services/bot/dynamic-agent.service';

export class WhatsAppIntegrationService {

  /**
   * Send message to WhatsApp using the webhook edge function
   */
  async sendMessage(
    whatsappNumber: string,
    message: string,
    quickReplies?: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          to: whatsappNumber,
          message,
          quickReplies
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Process incoming message from a conversation
   */
  async processIncomingMessage(
    conversationId: string,
    content: string
  ): Promise<void> {
    try {
      // Get bot response using ONLY dynamic prompts from /bot configuration
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

      if (!conversation) throw new Error('Conversation not found');

      const agentResponse = await dynamicAgentService.getAgentResponse(
        conversation.product_group || 'indefinido',
        content,
        conversation as any
      );

      const botResponse = {
        response: agentResponse.text,
        quickReplies: agentResponse.quickReplies,
        shouldTransferToHuman: agentResponse.shouldTransferToHuman
      };

      // Send response via WhatsApp
      if (botResponse.response) {
        await this.sendMessage(
          conversation.whatsapp_number,
          botResponse.response,
          botResponse.quickReplies
        );

        // Save bot response to messages table
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'bot',
          content: botResponse.response,
          status: 'sent'
        });
      }

      // Handle transfer to human if needed
      if (botResponse.shouldTransferToHuman) {
        await this.transferToHuman(conversationId);
      }

    } catch (error) {
      console.error('Failed to process incoming message:', error);
      throw error;
    }
  }

  /**
   * Transfer conversation to human agent
   */
  async transferToHuman(conversationId: string): Promise<void> {
    try {
      // Update conversation status
      await supabase
        .from('conversations')
        .update({ 
          status: 'with_agent',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Send notification message to customer
      const { data: conversation } = await supabase
        .from('conversations')
        .select('whatsapp_number, customer_name')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const transferMessage = `Olá${conversation.customer_name ? `, ${conversation.customer_name}` : ''}! 

Vou transferir você para um de nossos especialistas que poderá ajudar você da melhor forma possível.

Por favor, aguarde um momento que em breve você será atendido por um humano. 🤝`;

        await this.sendMessage(conversation.whatsapp_number, transferMessage);

        // Save transfer message
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'system',
          content: transferMessage,
          status: 'sent'
        });
      }

      // Log system event
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'WhatsAppIntegrationService',
        message: 'Conversation transferred to human agent',
        data: { conversationId }
      });

    } catch (error) {
      console.error('Failed to transfer to human:', error);
      throw error;
    }
  }

  /**
   * Send bulk message to multiple WhatsApp numbers
   */
  async sendBulkMessage(
    whatsappNumbers: string[],
    message: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const number of whatsappNumbers) {
      try {
        await this.sendMessage(number, message);
        success++;
      } catch (error) {
        console.error(`Failed to send message to ${number}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get WhatsApp Business profile info
   */
  async getBusinessProfile(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('get-whatsapp-profile');
      
      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get business profile:', error);
      throw error;
    }
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('test-whatsapp-connection');
      
      if (error) {
        throw error;
      }

      return data?.success || false;
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const whatsappIntegration = new WhatsAppIntegrationService();