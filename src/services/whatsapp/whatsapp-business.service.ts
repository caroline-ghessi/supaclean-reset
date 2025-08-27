import { supabase } from '@/lib/supabase';
import { formatWhatsAppNumber } from '@/lib/config';

interface SendMessageResponse {
  messages: Array<{
    id: string;
    message_status: string;
  }>;
}

export class WhatsAppBusinessService {
  // This service now works via Supabase edge functions
  // The actual API calls are made server-side with proper secrets

  async sendTextMessage(to: string, text: string): Promise<SendMessageResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          to: formatWhatsAppNumber(to),
          message: text
        }
      });

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'WhatsAppBusinessService',
        message: 'Text message sent',
        data: { to, messageId: data?.data?.messages?.[0]?.id }
      });

      return data?.data || {};
    } catch (error) {
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'WhatsAppBusinessService',
        message: 'Failed to send text message',
        data: {
          to,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  async sendInteractiveMessage(
    to: string,
    text: string,
    buttons: string[]
  ): Promise<SendMessageResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          to: formatWhatsAppNumber(to),
          message: text,
          quickReplies: buttons.slice(0, 3)
        }
      });

      if (error) {
        throw new Error(`Failed to send interactive message: ${error.message}`);
      }

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'WhatsAppBusinessService',
        message: 'Interactive message sent',
        data: {
          to,
          buttonsCount: buttons.length,
          messageId: data?.data?.messages?.[0]?.id
        }
      });

      return data?.data || {};
    } catch (error) {
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'WhatsAppBusinessService',
        message: 'Failed to send interactive message',
        data: {
          to,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  async sendListMessage(
    to: string,
    headerText: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  ): Promise<SendMessageResponse> {
    // Note: List messages require a more complex edge function
    // For now, we'll convert to a simple interactive message
    const quickReplies = sections.flatMap(section => 
      section.rows.map(row => row.title)
    ).slice(0, 3);

    return this.sendInteractiveMessage(to, `${headerText}\n\n${bodyText}`, quickReplies);
  }

  async sendMediaMessage(
    to: string,
    mediaType: 'image' | 'document' | 'audio' | 'video',
    mediaUrl: string,
    caption?: string
  ): Promise<SendMessageResponse> {
    // Media messages are sent as text for now
    // In a full implementation, you'd create a separate edge function for media
    const message = caption || `[${mediaType} attachment: ${mediaUrl}]`;
    return this.sendTextMessage(to, message);
  }

  async markAsRead(messageId: string): Promise<void> {
    // Mark as read functionality would be implemented in a separate edge function
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'WhatsAppBusinessService',
      message: 'Message marked as read (placeholder)',
      data: { messageId }
    });
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('test-whatsapp-connection');
      
      if (error) {
        throw error;
      }

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'WhatsAppBusinessService',
        message: 'Connection test successful',
        data: { success: data?.success }
      });

      return data?.success || false;
    } catch (error) {
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'WhatsAppBusinessService',
        message: 'Connection test failed',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }
}

// Singleton instance
export const whatsappService = new WhatsAppBusinessService();