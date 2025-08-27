import { BaseAgent, AgentResponse, ConversationWithContext } from './base-agent';

export class SteelFrameAgent extends BaseAgent {
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
        text: `${this.getGreeting()}! 🏗️ Steel Frame é o futuro da construção! 

Construção industrializada, rápida, sustentável e econômica. Somos especialistas em Light Steel Frame (LSF).

Você já tem o projeto arquitetônico ou ainda está na fase de planejamento?`,
        quickReplies: [
          '📐 Tenho projeto',
          '📋 Preciso de projeto', 
          '🤔 Só pesquisando',
          '💬 Falar com engenheiro'
        ]
      };
    }

    // Has project flow
    if (context.has_architectural_project || message.match(/tenho projeto|projeto pronto|arquiteto/i)) {
      return {
        text: `Perfeito! Com projeto em mãos, podemos te dar um orçamento muito preciso! 📐

**Vantagens do Steel Frame:**
⚡ Obra 60% mais rápida que alvenaria
🌱 95% menos entulho e desperdício  
💰 Economia de até 30% no total da obra
🏠 Maior área útil (paredes mais finas)
🛡️ Estrutura antissísmica e resistente

Qual é a área total da construção do seu projeto?`,
        quickReplies: [
          '🏠 50-100m²',
          '🏠 100-150m²',
          '🏠 150-250m²',
          '🏢 Mais de 250m²'
        ]
      };
    }

    // Needs project flow
    if (context.has_architectural_project === false || message.match(/não tenho|preciso|sem projeto/i)) {
      return {
        text: `Sem problemas! Temos uma equipe de arquitetos especialistas em Steel Frame! 👨‍💼

**Nosso serviço completo inclui:**
🎯 Projeto arquitetônico personalizado
📐 Projeto estrutural em Steel Frame
📋 Aprovação na prefeitura
🔧 Execução da obra completa

Para fazer um pré-projeto, qual tipo de construção você tem em mente?`,
        quickReplies: [
          '🏠 Casa térrea',
          '🏠 Casa de 2 andares',
          '🏢 Casa comercial',
          '📏 Ainda não sei'
        ]
      };
    }

    // Area discussion and pricing
    if (context.construction_size_m2 || message.match(/área|metro|m²|tamanho/i)) {
      const area = context.construction_size_m2 || 120;
      const pricePerSqm = 1400; // R$ 1.400/m² estimate for steel frame
      const estimatedCost = area * pricePerSqm;
      
      return {
        text: `Com ${area}m² em Steel Frame, você terá uma casa moderna e eficiente!

💰 **Investimento estimado:** ${this.formatCurrency(estimatedCost)}
📊 **Custo por m²:** ${this.formatCurrency(pricePerSqm)}/m²

⏱️ **Cronograma previsto:**
• Fundação: 15 dias
• Estrutura metálica: 10 dias  
• Fechamentos: 20 dias
• Acabamentos: 25 dias
**Total: ~70 dias** (vs 180 dias alvenaria)

🎯 **Incluso no orçamento:**
Estrutura + fechamento + cobertura + instalações básicas

Quer receber um orçamento detalhado?`,
        quickReplies: [
          '✅ Orçamento completo',
          '📅 Cronograma detalhado',
          '🏗️ Ver obras executadas',
          '💬 Falar com engenheiro'
        ]
      };
    }

    // Technical questions
    if (message.match(/como funciona|estrutura|resistência|durabilidade|isolamento/i)) {
      return {
        text: `🔧 **Como funciona o Steel Frame:**

**Estrutura:**
• Perfis de aço galvanizado de 0,95mm
• Montagem modular com parafusos
• Estrutura antissísmica e flexível
• Vida útil: 100+ anos

**Fechamento:**
• Placas cimentícias externas
• Isolamento térmico e acústico (lã de rocha)
• Drywall interno com acabamento
• Sistema respirável (sem umidade)

**Resistência:**
✅ Ventos até 250km/h
✅ Temperatura -20°C a +50°C  
✅ Antissísmico até 9.0 escala Richter
✅ Anticupim e antifungo

É a mesma tecnologia usada nos EUA, Japão e Europa!`,
        quickReplies: [
          '🌡️ Conforto térmico',
          '🔊 Isolamento acústico',
          '💧 Resistência à umidade',
          '📋 Quero orçamento'
        ]
      };
    }

    // Urgency handling
    if (contextInfo.hasUrgency || context.urgency === 'high') {
      return {
        text: `Steel Frame é perfeito para quem tem urgência! ⚡

🚀 **Cronograma acelerado:**
• Projeto: 15 dias
• Aprovação: 30 dias  
• Fundação: 10 dias
• Montagem estrutura: 7 dias
• Fechamento: 15 dias
• Acabamento: 20 dias

**Total: 3 meses** da aprovação à casa pronta!

Para agilizar seu projeto, vou te conectar direto com nosso engenheiro especialista. Ele pode fazer a visita ainda esta semana!`,
        quickReplies: [
          '📅 Agendar visita',
          '⚡ Cronograma urgente',
          '💰 Pagamento à vista',
          '📞 Ligar agora'
        ],
        shouldTransferToHuman: true
      };
    }

    // Default helpful response
    return {
      text: `Steel Frame é realmente a evolução da construção civil! 🚀

**Por que escolher Steel Frame:**
1️⃣ **Velocidade** - 3x mais rápido que alvenaria
2️⃣ **Sustentabilidade** - 95% menos desperdício
3️⃣ **Qualidade** - Precisão milimétrica
4️⃣ **Economia** - Custo-benefício excelente

Qual aspecto do Steel Frame mais te interessa? Velocidade, economia, sustentabilidade ou qualidade?`,
      quickReplies: [
        '⚡ Velocidade da obra',
        '💰 Economia no projeto',
        '🌱 Sustentabilidade',
        '🏗️ Qualidade da construção'
      ]
    };
  }
}