import { BaseAgent, AgentResponse } from './base-agent';
import { Conversation, ProjectContext } from '@/types/conversation.types';

export class DrywallAgent extends BaseAgent {
  async generateResponse(
    message: string,
    conversationData: Conversation & { project_contexts?: Partial<ProjectContext> }
  ): Promise<AgentResponse> {
    const context = conversationData.project_contexts || {};
    const contextInfo = this.extractContextualInfo(message);
    const messageCount = conversationData.messages?.length || 0;

    // Greeting flow
    if (messageCount <= 2 || message.match(/oi|olá|ola|bom dia|boa tarde|boa noite/i)) {
      return {
        text: `${this.getGreeting()}! 🧱 Drywall é nossa especialidade! 

Divisórias, forros, paredes e projetos completos. Trabalho limpo, rápido e com acabamento perfeito.

O que você precisa em drywall?`,
        quickReplies: [
          '🏠 Divisórias residenciais',
          '🏢 Projeto comercial', 
          '🏠 Forro de gesso',
          '🤔 Ainda decidindo'
        ]
      };
    }

    // Residential divisions
    if (message.match(/divisória|dividir|quarto|sala|residencial|casa/i)) {
      return {
        text: `Perfeito! Divisórias residenciais são ideais para otimizar espaços! 🏠

**Vantagens do drywall residencial:**
✨ Obra limpa (sem quebra-quebra)
⚡ Instalação rápida (1-3 dias)
🔌 Fácil passagem de fiação
🎨 Acabamento liso pronto para pintura
💰 Custo-benefício excelente

Quantos metros quadrados de divisórias você precisa? E em quantos ambientes?`,
        quickReplies: [
          '📏 10-20m²',
          '📏 20-40m²',
          '📏 40-60m²',
          '🏠 Casa inteira'
        ]
      };
    }

    // Commercial projects
    if (message.match(/comercial|escritório|empresa|loja|consultório/i)) {
      return {
        text: `Excelente! Projetos comerciais são nossa especialidade! 🏢

**Soluções corporativas:**
🏢 Divisórias para escritórios
🔊 Salas de reunião com isolamento acústico
🏥 Consultórios com normas técnicas
🛍️ Lojas com projetos personalizados
🔥 Divisórias corta-fogo (quando necessário)

Qual tipo de ambiente comercial você precisa dividir?`,
        quickReplies: [
          '💼 Escritório',
          '🏥 Consultório',
          '🛍️ Loja/comércio',
          '🏭 Industrial'
        ]
      };
    }

    // Ceiling/roof
    if (message.match(/forro|gesso|teto|rebaixamento/i)) {
      return {
        text: `Forros de drywall são lindos e funcionais! ✨

**Tipos de forro disponíveis:**
🌟 **Forro liso** - Acabamento tradicional
💡 **Forro com spots** - Iluminação embutida  
🎨 **Forro rebaixado** - Esconder vigas e tubulações
🔲 **Forro modular** - Acesso para manutenção
❄️ **Forro isolante** - Conforto térmico

Qual é a área do forro que você precisa? E que tipo de iluminação você quer?`,
        quickReplies: [
          '💡 Com spots LED',
          '🌟 Forro liso simples',
          '🔲 Modular removível',
          '📏 Preciso medir'
        ]
      };
    }

    // Area and pricing
    if (context.floor_quantity_m2 || message.match(/área|metro|m²|tamanho|orçamento/i)) {
      const area = context.floor_quantity_m2 || 30;
      const pricePerSqm = 45; // R$ 45/m² estimate
      const estimatedCost = area * pricePerSqm;
      
      return {
        text: `Com ${area}m² de drywall, temos uma solução completa!

💰 **Investimento:** ${this.formatCurrency(estimatedCost)}
📊 **Custo por m²:** ${this.formatCurrency(pricePerSqm)}/m² (material + mão de obra)

📋 **Incluso no serviço:**
• Estrutura metálica galvanizada
• Placas de gesso padrão ou RU/RF
• Fita, massa e acabamento
• Mão de obra especializada
• Limpeza pós-obra

⏱️ **Prazo:** 2-5 dias úteis dependendo da complexidade

Quer agendar uma medição gratuita para orçamento exato?`,
        quickReplies: [
          '✅ Agendar medição',
          '📋 Orçamento detalhado',
          '🔧 Tipos de placa',
          '📞 Falar com técnico'
        ]
      };
    }

    // Technical questions
    if (message.match(/placa|ru|rf|resistente|umidade|fogo/i)) {
      return {
        text: `📋 **Tipos de placas disponíveis:**

🌟 **ST (Standard)** - Uso geral, ambientes secos
💧 **RU (Resistente à Umidade)** - Banheiros, cozinhas
🔥 **RF (Resistente ao Fogo)** - Áreas de escape, garagens
💪 **RF+RU** - Resistente ao fogo E umidade

**Estrutura:**
• Perfis galvanizados 48mm ou 70mm
• Fixação com parafusos específicos
• Isolamento acústico (opcional)

**Acabamento:**
• Fita de papel microperfurada
• Massa acrílica em 3 demãos
• Lixa fina e primer
• Pronto para pintura

A escolha da placa depende do ambiente. Te ajudo a escolher a ideal!`,
        quickReplies: [
          '💧 Para área úmida',
          '🔥 Para área de risco',
          '🔊 Com isolamento acústico',
          '📋 Orçamento completo'
        ]
      };
    }

    // Urgency handling
    if (contextInfo.hasUrgency || context.urgency === 'high') {
      return {
        text: `Urgência em drywall é nossa especialidade! ⚡

🚀 **Atendimento express:**
• Medição em 24h
• Orçamento no mesmo dia
• Início da obra em 48h
• Execução rápida (2-3 dias)

Para projetos urgentes, temos equipe dedicada que trabalha aos sábados se necessário.

Vou te conectar com nosso supervisor técnico agora! Qual o melhor horário para a visita?`,
        quickReplies: [
          '🌅 Manhã (8h-12h)',
          '🌞 Tarde (13h-17h)',
          '📅 Sábado',
          '⚡ Hoje mesmo'
        ],
        shouldTransferToHuman: true
      };
    }

    // Default helpful response
    return {
      text: `Drywall é a solução ideal para divisórias modernas! 🧱

**Vantagens do nosso drywall:**
1️⃣ **Rapidez** - Obra em poucos dias
2️⃣ **Limpeza** - Sem entulho nem sujeira
3️⃣ **Versatilidade** - Curvas, nichos, prateleiras
4️⃣ **Acabamento** - Superfície lisa e perfeita

Qual é sua principal necessidade? Dividir ambiente, fazer forro ou projeto completo?`,
      quickReplies: [
        '🏠 Dividir ambientes',
        '✨ Forro decorativo',
        '🎨 Projeto completo',
        '💰 Ver preços'
      ]
    };
  }
}