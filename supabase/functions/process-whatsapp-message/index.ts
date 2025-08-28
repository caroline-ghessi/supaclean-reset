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
      sender_type: 'agent',
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
    // Load system configurations
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

    // Load conversation with context
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

    // Classify intent using dynamic keywords
    const classification = await classifyIntentDynamic(
      message,
      conversation.product_group,
      conversation.messages.map((m: any) => m.content)
    );

    // Log classification
    await supabase.from('classification_logs').insert({
      conversation_id: conversationId,
      message_text: message,
      classified_category: classification.category,
      confidence_score: classification.confidence,
      status: classification.confidence >= (configMap.master_agent_min_confidence || 0.7) ? 'success' : 'low_confidence',
      processing_time_ms: 50, // Simplified
      metadata: { entities: classification.entities }
    });

    // Update conversation category if changed
    if (classification.category !== conversation.product_group) {
      await supabase
        .from('conversations')
        .update({ 
          product_group: classification.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }

    // Generate response
    const messageCount = conversation.messages?.length || 0;
    const lowerMessage = message.toLowerCase();
    
    let response = '';
    let quickReplies: string[] = [];
    let shouldTransferToHuman = false;

    // Check if first message (greeting)
    if (messageCount === 0 || 
        lowerMessage.includes('oi') || 
        lowerMessage.includes('olá') || 
        lowerMessage.includes('ola')) {
      
      response = configMap.master_agent_welcome_message || 
        `Olá! 😊 Bem-vindo à Drystore!\n\nSou o assistente virtual e estou aqui para ajudar você a encontrar a melhor solução.\n\n**Como posso ajudar hoje?**`;
      
      quickReplies = ['☀️ Energia Solar', '🏠 Telhas Shingle', '🔧 Ferramentas', '🏗️ Steel Frame'];
    }
    // Check if low confidence classification
    else if (classification.confidence < (configMap.master_agent_min_confidence || 0.7)) {
      response = configMap.master_agent_fallback_message ||
        `Entendi sua mensagem!\n\nPara melhor atendimento, você pode:\n- Escolher uma das opções abaixo\n- Pedir para falar com um especialista\n\n**Principais áreas que atendemos:**`;
      
      quickReplies = ['Energia Solar', 'Telhas', 'Steel Frame', 'Falar com especialista'];
      shouldTransferToHuman = messageCount > 3;
    }
    // Category-specific responses
    else {
      switch (classification.category) {
        case 'energia_solar':
          response = `☀️ Ótimo interesse em energia solar!\n\nSomos **parceiros exclusivos GE no Sul do Brasil** 🏆\n\nOferecemos:\n⚡ Sistemas completos de geração\n🔋 Baterias para nunca ficar sem luz\n📊 Redução de até 95% na conta\n✅ 25 anos de garantia nos painéis\n\nPara dimensionar o sistema ideal para você:\n**Qual o valor médio da sua conta de luz?**`;
          quickReplies = ['Até R$ 200', 'R$ 200-500', 'R$ 500-1000', 'Acima de R$ 1000'];
          break;
        
        case 'telha_shingle':
          response = `🏠 Excelente escolha pelas telhas shingle!\n\nTrabalhamos com **Owens Corning** dos EUA - a melhor do mercado, com:\n✅ 50 anos de garantia (documento oficial)\n✅ Resistência a ventos de 130 mph\n✅ Tecnologia SureNail exclusiva\n✅ 30+ opções de cores\n\nPara preparar o melhor orçamento, preciso saber:\n**Sua obra é uma construção nova ou reforma de telhado existente?**`;
          quickReplies = ['Construção Nova', 'Reforma', 'Ainda não decidi'];
          break;
        
        default:
          response = configMap.master_agent_fallback_message ||
            `Entendi sua mensagem!\n\nPara melhor atendimento, você pode:\n- Escolher uma das opções abaixo\n- Pedir para falar com um especialista\n\n**Principais áreas que atendemos:**`;
          
          quickReplies = ['Energia Solar', 'Telhas', 'Steel Frame', 'Falar com especialista'];
          shouldTransferToHuman = messageCount > 5;
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

async function classifyIntentDynamic(
  message: string,
  currentCategory: any,
  conversationHistory: string[]
): Promise<{
  category: string;
  confidence: number;
  entities: Record<string, any>;
}> {
  // Load dynamic keywords
  const { data: keywords } = await supabase
    .from('classification_keywords')
    .select('*')
    .eq('is_active', true);

  const normalizedMessage = normalizeText(message);
  const scores = new Map<string, number>();

  // Calculate scores based on dynamic keywords
  for (const keywordData of keywords || []) {
    const category = keywordData.category;
    const keyword = normalizeText(keywordData.keyword);
    const weight = keywordData.weight || 5;

    if (!scores.has(category)) {
      scores.set(category, 0);
    }

    if (normalizedMessage.includes(keyword)) {
      scores.set(category, scores.get(category)! + weight);
    }
  }

  // Find top category
  let topCategory = 'indefinido';
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
      entities: extractEntities(message)
    };
  }

  return {
    category: topCategory,
    confidence: confidence > 0.3 ? confidence : 0.3,
    entities: extractEntities(message)
  };
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEntities(message: string): Record<string, any> {
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

function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Brazil country code if missing
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}