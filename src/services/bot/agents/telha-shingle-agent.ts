import { BaseAgent, AgentResponse, ConversationWithContext } from './base-agent';

export class TelhaShingleAgent extends BaseAgent {
  async generateResponse(
    message: string,
    conversationData: ConversationWithContext
  ): Promise<AgentResponse> {
    const context = conversationData.project_contexts || {};
    const contextInfo = this.extractContextualInfo(message);
    const messageCount = conversationData.messages?.length || 0;

    // Greeting flow
    if (messageCount <= 2 || message.match(/oi|olá|ola|bom dia|boa tarde|boa noite/i)) {
      return {
        text: `${this.getGreeting()}! 🏠 Excelente escolha pela telha shingle! 

Somos especialistas em **Telhado dos Sonhos** - a telha shingle premium que transforma qualquer casa.

É para uma casa nova ou você vai reformar um telhado existente?`,
        quickReplies: [
          '🏗️ Casa nova',
          '🔄 Reforma do telhado', 
          '🤔 Ainda decidindo',
          '💬 Falar com especialista'
        ]
      };
    }

    // New construction flow
    if (context.roof_status === 'nova_construcao' || message.match(/casa nova|construindo|construção nova/i)) {
      return {
        text: `Perfeito para casa nova! 🏗️ A telha shingle é ideal porque:

✨ **Vantagens para construção nova:**
• Estrutura mais leve = economia na madeira
• Instalação 3x mais rápida que telha cerâmica
• Design moderno e valorização do imóvel
• 30 anos de garantia contra infiltração

Qual é a área aproximada do seu telhado? (em m²)`,
        quickReplies: [
          '📏 50-100m²',
          '📏 100-150m²',
          '📏 150-200m²',
          '📏 Mais de 200m²',
          '❓ Não sei a área'
        ]
      };
    }

    // Reform flow
    if (context.roof_status === 'reforma' || message.match(/reforma|trocar|substituir|antigo/i)) {
      return {
        text: `Entendi! Reforma de telhado é nossa especialidade! 🔧

A telha shingle é perfeita para reforma porque:

🔹 **Pode ser instalada sobre o telhado antigo** (em muitos casos)
🔹 **Sem quebra-quebra** = obra mais limpa
🔹 **Resolve problemas de goteira** definitivamente
🔹 **Moderniza completamente** a aparência da casa

O telhado atual tem algum problema específico? Goteiras, telhas quebradas ou só quer modernizar?`,
        quickReplies: [
          '💧 Problemas de goteira',
          '🔨 Telhas quebradas',
          '✨ Quer modernizar',
          '📋 Fazer orçamento'
        ]
      };
    }

    // Area and budget discussion
    if (context.roof_size_m2 || message.match(/área|metro|m²|tamanho/i)) {
      const area = context.roof_size_m2 || 120;
      const estimatedCost = area * 85; // R$ 85/m² estimate
      
      return {
        text: `Com ${area}m² de telhado, temos uma solução completa para você!

💡 **Investimento estimado:** ${this.formatCurrency(estimatedCost)}
(Incluindo material + mão de obra especializada)

🎨 **Cores disponíveis:**
• Cinza Grafite (mais popular)
• Marrom Colonial  
• Verde Musgo
• Vermelho Colonial

A telha shingle valoriza o imóvel em até 15% e tem garantia de 30 anos!

Quer agendar uma medição gratuita para orçamento exato?`,
        quickReplies: [
          '✅ Agendar medição',
          '🎨 Ver cores disponíveis',
          '💰 Opções de pagamento',
          '⏱️ Prazo de execução'
        ]
      };
    }

    // Urgency handling
    if (contextInfo.hasUrgency || context.urgency === 'high') {
      return {
        text: `Entendi a urgência! ⚡ Para casos urgentes de goteira ou problemas no telhado, temos equipe de emergência.

🚨 **Atendimento prioritário:**
• Vistoria técnica em 24h
• Orçamento expresso
• Início da obra em até 5 dias úteis
• Equipe especializada certificada

Vou te conectar com nosso supervisor técnico agora. Qual o melhor contato para ele te ligar?`,
        quickReplies: [
          '📱 WhatsApp atual',
          '☎️ Outro telefone',
          '📧 Prefiro e-mail',
          '🏠 Visita hoje'
        ],
        shouldTransferToHuman: true
      };
    }

    // Technical questions
    if (message.match(/material|qualidade|garantia|durabilidade|instalação/i)) {
      return {
        text: `📋 **Especificações da Telha Shingle Premium:**

🏆 **Material:** Fibra de vidro + asfalto modificado + grânulos cerâmicos
🛡️ **Garantia:** 30 anos contra infiltração
🌡️ **Resistência:** -40°C a +80°C, ventos até 180km/h
⚖️ **Peso:** 50% mais leve que telha cerâmica
🔥 **Segurança:** Classificação A - resistente ao fogo

🔧 **Instalação profissional:**
• Equipe certificada pelo fabricante
• Prazo: 2-5 dias dependendo da área
• Garantia de instalação: 5 anos

A telha shingle é usada em 80% das casas nos EUA. Aqui no Brasil, está revolucionando a construção civil!`,
        quickReplies: [
          '✅ Quero orçamento',
          '👨‍🔧 Ver equipe',
          '📸 Fotos de obras',
          '💬 Falar com vendedor'
        ]
      };
    }

    // Default helpful response
    return {
      text: `A telha shingle realmente transforma qualquer casa! 🏠✨

**Por que escolher telha shingle:**
1️⃣ **Beleza** - Design moderno e sofisticado
2️⃣ **Durabilidade** - 30 anos de garantia
3️⃣ **Economia** - Estrutura mais leve
4️⃣ **Rapidez** - Instalação em poucos dias

Qual é sua maior dúvida sobre a telha shingle? Preço, instalação, durabilidade ou design?`,
      quickReplies: [
        '💰 Preço e formas de pagamento',
        '🔧 Como é a instalação',
        '⏳ Durabilidade e garantia',
        '🎨 Cores e modelos'
      ]
    };
  }
}