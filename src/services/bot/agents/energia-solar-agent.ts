import { BaseAgent, AgentResponse, ConversationWithContext } from './base-agent';

export class EnergiaSolarAgent extends BaseAgent {
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
        text: `${this.getGreeting()}! 🌞 Que ótimo interesse em energia solar! 

Somos parceiros oficiais da GE e temos as melhores soluções em energia solar do mercado. 

Para te ajudar melhor, qual é o valor médio da sua conta de energia elétrica?`
      };
    }

    // Budget information flow
    if (!context.energy_bill_value && contextInfo.wantsBudget) {
      return {
        text: `Perfeito! Para calcular o sistema ideal para você, preciso saber o valor da sua conta de energia.

Isso me ajuda a dimensionar corretamente a potência do sistema e calcular o retorno do investimento. 

Qual é o valor médio da sua conta mensal?`
      };
    }

    // Has bill value, talk about benefits
    if (context.energy_bill_value && !context.has_energy_backups) {
      const estimatedValue = typeof context.energy_bill_value === 'number' 
        ? context.energy_bill_value 
        : 350;
      
      const systemSize = Math.ceil(estimatedValue * 12 / 1200); // Rough calculation
      
      return {
        text: `Excelente! Com uma conta de ${this.formatCurrency(estimatedValue)}, você pode instalar um sistema de aproximadamente ${systemSize}kWp.

⚡ **Benefícios para você:**
• Economia de até 95% na conta de luz
• Valorização do imóvel em até 20%
• Retorno do investimento em 4-6 anos
• Vida útil de 25+ anos com garantia

Você gostaria de ter também um sistema de backup com baterias para não ficar sem energia durante quedas de luz?`
      };
    }

    // Urgency handling
    if (contextInfo.hasUrgency || context.urgency === 'high') {
      return {
        text: `Entendi a urgência! ⚡ Para projetos urgentes, temos um time especializado que pode fazer a visita técnica em até 24h.

Com sua conta de energia, posso adiantar que o investimento fica entre R$ 15.000 a R$ 35.000, e você pode financiar em até 120x.

Vou te conectar com nosso especialista solar agora mesmo. Qual o melhor horário para ele te ligar?`,
        shouldTransferToHuman: true
      };
    }

    // Technical questions
    if (message.match(/painel|equipamento|inversor|instalação|garantia/i)) {
      return {
        text: `📋 **Especificações técnicas do nosso sistema GE:**

🔹 **Painéis:** Monocristalinos 450W+ com 25 anos de garantia
🔹 **Inversor:** String ou micro inversores com monitoramento
🔹 **Estrutura:** Alumínio com proteção contra corrosão
🔹 **Instalação:** Equipe certificada com 5 anos de garantia

O sistema é conectado à rede elétrica (on-grid) e durante o dia suas placas geram energia que pode ser consumida ou injetada na rede, criando créditos para usar à noite.

Quer agendar uma visita técnica gratuita para dimensionamento personalizado?`
      };
    }

    // Default helpful response
    return {
      text: `Entendi! Para energia solar, o mais importante é:

1️⃣ **Análise do consumo** - Sua conta de luz atual
2️⃣ **Avaliação do telhado** - Área e exposição solar  
3️⃣ **Projeto personalizado** - Sistema ideal para você
4️⃣ **Financiamento** - Parcelas que cabem no bolso

A energia solar se paga sozinha! A economia na conta de luz paga o financiamento do sistema.

O que te interessou mais na energia solar? Economia, sustentabilidade ou independência energética?`
    };
  }
}