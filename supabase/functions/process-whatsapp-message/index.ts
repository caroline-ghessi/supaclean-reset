import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// WhatsApp Business API
const whatsappToken = Deno.env.get('META_ACCESS_TOKEN')!;
const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, whatsappNumber } = await req.json();

    if (!conversationId || !message || !whatsappNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process message with bot orchestrator (simplified version)
    const botResponse = await processMessageWithBot(conversationId, message);

    // Send response via WhatsApp
    if (botResponse.response) {
      await sendWhatsAppMessage(whatsappNumber, botResponse.response, botResponse.quickReplies);
    }

    // Save bot response to database
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'bot',
      content: botResponse.response,
      status: 'sent'
    });

    // Check if should transfer to human
    if (botResponse.shouldTransferToHuman) {
      await supabase
        .from('conversations')
        .update({ status: 'with_agent' })
        .eq('id', conversationId);
      
      // Send notification to agents (could be implemented later)
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'process-whatsapp-message',
        message: 'Conversation transferred to human agent',
        data: { conversationId, whatsappNumber }
      });
    }

    return new Response(
      JSON.stringify({ success: true, botResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'process-whatsapp-message',
      message: 'Failed to process message',
      data: { error: error.message }
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processMessageWithBot(conversationId: string, message: string) {
  try {
    // Load conversation with context (simplified)
    const { data: conversation } = await supabase
      .from('conversations')
      .select(`
        *,
        project_contexts (*),
        messages (content, sender_type, created_at)
      `)
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Simple bot logic - this would normally call your BotOrchestrator
    let response = '';
    let quickReplies: string[] = [];
    let shouldTransferToHuman = false;

    // Basic greeting detection
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('ola')) {
      response = `Olá! 😊 Bem-vindo à Drystore!

Sou o assistente virtual e estou aqui para ajudar você a encontrar a melhor solução.

**Como posso ajudar hoje?**`;
      quickReplies = ['☀️ Energia Solar', '🏠 Telhas Shingle', '🏗️ Steel Frame', '🔧 Ferramentas'];
    }
    // Product interest detection
    else if (lowerMessage.includes('energia solar') || lowerMessage.includes('solar')) {
      response = `☀️ Ótimo interesse em energia solar!

Somos **parceiros exclusivos GE no Sul do Brasil** 🏆

Oferecemos:
⚡ Sistemas completos de geração
🔋 Baterias para nunca ficar sem luz
📊 Redução de até 95% na conta
✅ 25 anos de garantia nos painéis

Para dimensionar o sistema ideal para você:
**Qual o valor médio da sua conta de luz?**`;
      quickReplies = ['Até R$ 200', 'R$ 200-500', 'R$ 500-1000', 'Acima de R$ 1000'];
    }
    else if (lowerMessage.includes('telha') || lowerMessage.includes('shingle')) {
      response = `🏠 Excelente escolha pelas telhas shingle!

Trabalhamos com **Owens Corning** dos EUA - a melhor do mercado, com:
✅ 50 anos de garantia (documento oficial)
✅ Resistência a ventos de 130 mph
✅ Tecnologia SureNail exclusiva
✅ 30+ opções de cores

Para preparar o melhor orçamento, preciso saber:
**Sua obra é uma construção nova ou reforma de telhado existente?**`;
      quickReplies = ['Construção Nova', 'Reforma', 'Ainda não decidi'];
    }
    // Default response
    else {
      response = `Entendi sua mensagem! 

Para melhor atendimento, você pode:
- Escolher uma das opções abaixo
- Pedir para falar com um especialista

**Principais áreas que atendemos:**`;
      quickReplies = ['Energia Solar', 'Telhas', 'Steel Frame', 'Falar com especialista'];
      
      // Transfer to human if multiple messages without clear intent
      if (conversation.messages?.length > 3) {
        shouldTransferToHuman = true;
      }
    }

    return {
      response,
      quickReplies,
      shouldTransferToHuman,
      metadata: { processed_at: new Date().toISOString() }
    };

  } catch (error) {
    console.error('Error in bot processing:', error);
    return {
      response: 'Desculpe, tive um problema ao processar sua mensagem. Vou chamar um atendente para ajudar você.',
      shouldTransferToHuman: true
    };
  }
}

async function sendWhatsAppMessage(to: string, text: string, quickReplies?: string[]) {
  try {
    const baseUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    let messagePayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formatPhoneNumber(to),
      type: 'text',
      text: { body: text }
    };

    // If we have quick replies, send as interactive message
    if (quickReplies && quickReplies.length > 0) {
      messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formatPhoneNumber(to),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text },
          action: {
            buttons: quickReplies.slice(0, 3).map((btn, idx) => ({
              type: 'reply',
              reply: {
                id: `btn_${idx}`,
                title: btn.substring(0, 20) // WhatsApp limit
              }
            }))
          }
        }
      };
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('WhatsApp message sent:', data);
    return data;

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Brazil country code if missing
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}