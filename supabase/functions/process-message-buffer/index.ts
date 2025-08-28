import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();
    
    console.log(`Processing message buffer for conversation: ${conversationId}`);

    // Buscar buffer não processado para esta conversa
    const { data: buffer, error: bufferError } = await supabase
      .from('message_buffers')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('processed', false)
      .single();

    if (bufferError || !buffer) {
      console.log('No active buffer found or already processed');
      return new Response(JSON.stringify({ processed: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se já passou tempo suficiente
    const now = new Date();
    const shouldProcessAt = new Date(buffer.should_process_at);
    
    if (now < shouldProcessAt) {
      console.log('Buffer still within waiting period');
      return new Response(JSON.stringify({ processed: false, waiting: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Marcar buffer como processado
    await supabase
      .from('message_buffers')
      .update({
        processed: true,
        processed_at: now.toISOString()
      })
      .eq('id', buffer.id);

    // Agrupar todas as mensagens do buffer
    const messages = buffer.messages || [];
    const combinedMessage = messages.map(msg => msg.content).join(' ');

    console.log(`Processing combined message: ${combinedMessage}`);

    // Buscar dados da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Classificar intenção usando LLM
    const classificationResult = await supabase.functions.invoke('classify-intent-llm', {
      body: {
        message: combinedMessage,
        currentProductGroup: conversation.product_group,
        conversationId
      }
    });

    // Extrair dados do cliente em paralelo
    const extractionResult = await supabase.functions.invoke('extract-customer-data', {
      body: {
        conversationId,
        newMessage: combinedMessage
      }
    });

    let newProductGroup = conversation.product_group;
    
    if (classificationResult.data?.productGroup) {
      newProductGroup = classificationResult.data.productGroup;
      
      // Atualizar product_group na conversa se mudou
      if (newProductGroup !== conversation.product_group) {
        await supabase
          .from('conversations')
          .update({ product_group: newProductGroup })
          .eq('id', conversationId);
      }
    }

    // Gerar resposta do agente especializado
    let botResponse;

    // Se não conseguiu classificar ou é primeira interação indefinida
    if (!newProductGroup || newProductGroup === 'indefinido') {
      botResponse = {
        text: "Olá! Sobre qual produto ou solução você busca atendimento?",
        transferToHuman: false
      };
    } else {
      // Usar agente especializado baseado na categoria
      botResponse = await generateSpecializedResponse(
        combinedMessage,
        newProductGroup,
        conversation,
        extractionResult.data?.customerData
      );
    }

    // Salvar resposta do bot
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: botResponse.text,
        sender_type: 'bot',
        status: 'sent'
      });

    // Enviar mensagem via WhatsApp
    await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        to: conversation.whatsapp_number,
        message: botResponse.text
      }
    });

    // Atualizar status da conversa se necessário
    if (botResponse.transferToHuman) {
      await supabase
        .from('conversations')
        .update({
          status: 'transferred_to_human',
          last_message_at: now.toISOString()
        })
        .eq('id', conversationId);
    } else {
      await supabase
        .from('conversations')
        .update({
          last_message_at: now.toISOString()
        })
        .eq('id', conversationId);
    }

    return new Response(JSON.stringify({ 
      processed: true,
      productGroup: newProductGroup,
      responseText: botResponse.text
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing message buffer:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'process-message-buffer',
      message: 'Failed to process message buffer',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função para gerar resposta especializada
async function generateSpecializedResponse(
  message: string,
  productGroup: string,
  conversation: any,
  customerData: any
) {
  try {
    // Mapear categoria para resposta apropriada
    const responses = {
      'energia_solar': {
        text: `Olá! Que bom que você tem interesse em energia solar! É uma das melhores formas de reduzir drasticamente sua conta de luz. Para te ajudar melhor, você pode me contar qual o valor da sua conta de energia atual?`,
        transferToHuman: false
      },
      'telha_shingle': {
        text: `Olá! As telhas shingle são realmente uma excelente escolha para seu telhado! Elas oferecem beleza, durabilidade e proteção superior. Você já tem o projeto definido ou ainda está na fase de planejamento?`,
        transferToHuman: false
      },
      'steel_frame': {
        text: `Olá! Steel frame é uma tecnologia incrível para construção - rápida, econômica e sustentável! Você já tem o projeto arquitetônico ou ainda está na fase inicial de planejamento?`,
        transferToHuman: false
      },
      'drywall_divisorias': {
        text: `Olá! Drywall é perfeito para divisórias e acabamentos de qualidade! É prático, rápido de instalar e oferece ótimo acabamento. Qual ambiente você pretende trabalhar?`,
        transferToHuman: false
      },
      'ferramentas': {
        text: `Olá! Temos uma linha completa de ferramentas profissionais para todos os tipos de trabalho! Qual ferramenta você está buscando? Posso te ajudar a encontrar a ideal para sua necessidade.`,
        transferToHuman: false
      },
      'pisos': {
        text: `Olá! Nossos pisos oferecem qualidade e beleza para transformar seu ambiente! Você tem ideia de quantos metros quadrados precisa ou quais ambientes vai revestir?`,
        transferToHuman: false
      },
      'acabamentos': {
        text: `Olá! Temos uma linha completa de acabamentos para deixar seu projeto perfeito! Qual tipo de acabamento você está procurando?`,
        transferToHuman: false
      },
      'forros': {
        text: `Olá! Nossos forros são ideais para dar o acabamento perfeito ao seu ambiente! Qual tipo de ambiente você quer instalar o forro?`,
        transferToHuman: false
      },
      'institucional': {
        text: `Olá! Somos a Drystore, especialistas em materiais de construção e soluções inovadoras! Estamos aqui para ajudar você. Em que posso te auxiliar hoje?`,
        transferToHuman: false
      },
      'saudacao': {
        text: `Olá! Tudo bem? Seja bem-vindo à Drystore! Como posso te ajudar hoje?`,
        transferToHuman: false
      }
    };

    return responses[productGroup] || {
      text: `Olá! Obrigado por entrar em contato conosco. Sobre qual produto ou solução você busca atendimento?`,
      transferToHuman: false
    };

  } catch (error) {
    console.error('Error generating specialized response:', error);
    return {
      text: `Olá! Obrigado por entrar em contato. Um de nossos especialistas irá te atender em breve!`,
      transferToHuman: true
    };
  }
}