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

    // Gerar resposta usando o novo sistema de agentes inteligentes
    const agentResponse = await supabase.functions.invoke('intelligent-agent-response', {
      body: {
        message: combinedMessage,
        conversationId,
        productCategory: newProductGroup
      }
    });

    let botResponse = {
      text: "Olá! Um especialista entrará em contato em breve.",
      transferToHuman: false
    };

    if (agentResponse.data?.response) {
      botResponse = {
        text: agentResponse.data.response,
        transferToHuman: false
      };
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

// Importar agentes necessários
class BaseAgent {
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

  protected getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  protected extractContextualInfo(message: string) {
    const lowerMessage = message.toLowerCase();
    return {
      hasUrgency: /urgente|hoje|agora|rápido|imediato/.test(lowerMessage),
      wantsContact: /contato|telefone|ligar|falar|atendente/.test(lowerMessage),
      wantsBudget: /preço|valor|quanto|orçamento|custo/.test(lowerMessage),
      mentionedCompetitor: /concorrente|outro|empresa|comparar/.test(lowerMessage)
    };
  }
}

class GeneralAgent extends BaseAgent {
  async generateResponse(message, conversationData) {
    const messageCount = conversationData.messages?.length || 0;

    // Greeting flow
    if (messageCount <= 2 || message.match(/oi|olá|ola|bom dia|boa tarde|boa noite|hello|hey/i)) {
      return {
        text: `${this.getGreeting()}! 👋 Bem-vindo à **${this.companyInfo.name}**! 

Somos especialistas em soluções completas para construção civil:

🌟 **Nossas especialidades:**
${this.companyInfo.specialties.map(spec => `• ${spec}`).join('\n')}

Em que posso te ajudar hoje?`,
        transferToHuman: false
      };
    }

    // Default helpful response
    return {
      text: `😊 **Como posso te ajudar hoje?**

**Principais serviços da ${this.companyInfo.name}:**
⚡ **Energia Solar** - Economia na conta de luz
🏠 **Telha Shingle** - Telhados modernos e duráveis  
🏗️ **Steel Frame** - Construção rápida e econômica
🧱 **Drywall** - Divisórias e forros profissionais
🔧 **Ferramentas** - Equipamentos das melhores marcas
🎨 **Acabamentos** - Pisos, tintas e revestimentos

**O que você está procurando?**
Posso te dar informações detalhadas sobre qualquer um dos nossos produtos e serviços!`,
      transferToHuman: false
    };
  }
}

class SpecializedAgentFactory {
  getAgent(category) {
    // Para categorias específicas, retornar agentes especializados inline
    switch(category) {
      case 'energia_solar':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `Que bom que você tem interesse em energia solar! 🌞

É uma das melhores formas de reduzir drasticamente sua conta de luz. Nossa parceria com a GE nos permite oferecer sistemas de alta qualidade.

Para te ajudar melhor, você pode me contar qual o valor da sua conta de energia atual?`,
              transferToHuman: false
            };
          }
        };
      
      case 'telha_shingle':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `As telhas shingle são realmente uma excelente escolha para seu telhado! 🏠

Elas oferecem:
✅ Beleza e modernidade
✅ Durabilidade superior (até 30 anos)
✅ Proteção contra intempéries
✅ Instalação rápida e eficiente

Você já tem o projeto definido ou ainda está na fase de planejamento?`,
              transferToHuman: false
            };
          }
        };

      case 'steel_frame':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `Steel frame é uma tecnologia incrível para construção! 🏗️

**Vantagens:**
⚡ Construção até 70% mais rápida
💰 Economia de até 30% no custo total
🌱 Sustentável e ecológica
🏠 Estrutura resistente e durável

Você já tem o projeto arquitetônico ou ainda está na fase inicial de planejamento?`,
              transferToHuman: false
            };
          }
        };

      case 'drywall_divisorias':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `Drywall é perfeito para divisórias e acabamentos de qualidade! 🧱

**Benefícios:**
🚀 Instalação rápida e limpa
🎨 Acabamento profissional
🔧 Facilidade para instalações elétricas
💡 Isolamento acústico e térmico

Qual ambiente você pretende trabalhar? Residencial ou comercial?`,
              transferToHuman: false
            };
          }
        };

      case 'ferramentas':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `Temos uma linha completa de ferramentas profissionais! 🔧

**Marcas disponíveis:**
⚡ Makita - Qualidade japonesa
🔥 DeWalt - Resistência profissional  
🛠️ Bosch - Tecnologia alemã
🔨 Stanley - Tradição americana

Qual ferramenta você está buscando? Posso te ajudar a encontrar a ideal para sua necessidade.`,
              transferToHuman: false
            };
          }
        };

      case 'pisos':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `Nossos pisos oferecem qualidade e beleza para transformar seu ambiente! 🏠

**Opções disponíveis:**
🌟 Piso vinílico - Resistente e moderno
🪵 Piso laminado - Beleza da madeira
🧱 Porcelanato - Elegância e durabilidade
🏢 Carpete comercial - Conforto e praticidade

Você tem ideia de quantos metros quadrados precisa ou quais ambientes vai revestir?`,
              transferToHuman: false
            };
          }
        };

      case 'acabamentos':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `Temos uma linha completa de acabamentos para deixar seu projeto perfeito! 🎨

**Produtos disponíveis:**
🎨 Tintas premium - Suvinil, Coral
✨ Texturas especiais - Efeitos únicos
🪵 Vernizes e stains - Proteção da madeira
🌈 Consultoria de cores - Harmonização perfeita

Qual tipo de acabamento você está procurando?`,
              transferToHuman: false
            };
          }
        };

      case 'forros':
        return {
          async generateResponse(message, conversationData) {
            return {
              text: `Nossos forros são ideais para dar o acabamento perfeito ao seu ambiente! ✨

**Tipos disponíveis:**
🏠 Forro de gesso - Elegância clássica
💡 Forro com iluminação - Modernidade
🌡️ Forro térmico - Conforto e economia
🎵 Forro acústico - Isolamento sonoro

Qual tipo de ambiente você quer instalar o forro? Residencial, comercial ou industrial?`,
              transferToHuman: false
            };
          }
        };

      default:
        return new GeneralAgent();
    }
  }
}

// Função para gerar resposta usando agentes reais
async function generateSpecializedResponse(
  message: string,
  productGroup: string,
  conversation: any,
  customerData: any
) {
  try {
    // Buscar mensagens da conversa para contexto
    const { data: messages } = await supabase
      .from('messages')
      .select('content, sender_type, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // Preparar dados da conversa para o agente
    const conversationData = {
      ...conversation,
      messages: messages || [],
      project_contexts: customerData
    };

    // Usar agente geral para categorias indefinidas ou saudação
    if (['indefinido', 'saudacao', 'institucional'].includes(productGroup)) {
      const generalAgent = new GeneralAgent();
      const response = await generalAgent.generateResponse(message, conversationData);
      return {
        text: response.text,
        transferToHuman: response.transferToHuman || false
      };
    } else {
      // Usar agente especializado via factory
      const factory = new SpecializedAgentFactory();
      const agent = factory.getAgent(productGroup);
      const response = await agent.generateResponse(message, conversationData);
      return {
        text: response.text,
        transferToHuman: response.transferToHuman || false
      };
    }

  } catch (error) {
    console.error('Error generating specialized response:', error);
    return {
      text: `Olá! Obrigado por entrar em contato. Um de nossos especialistas irá te atender em breve!`,
      transferToHuman: true
    };
  }
}