import { BaseAgent, AgentResponse } from './base-agent';
import { Conversation, ProjectContext } from '@/types/conversation.types';

export class AcabamentosAgent extends BaseAgent {
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
        text: `${this.getGreeting()}! 🎨 Acabamentos é nossa especialidade! 

Tintas, texturas, massas, vernizes e tudo para dar o toque final perfeito na sua obra.

O que você precisa para o acabamento?`,
        quickReplies: [
          '🎨 Tintas e cores',
          '🏠 Texturas decorativas', 
          '🌟 Vernizes e seladores',
          '🔧 Massas e preparação'
        ]
      };
    }

    // Paints and colors
    if (message.match(/tinta|pintar|cor|cores|parede/i)) {
      return {
        text: `🎨 Tintas de qualidade para todos os ambientes!

**Marcas premium:**
🏆 **Suvinil** - Líder em qualidade
• Tinta Premium com proteção antimanchas
• Cores exclusivas e tendências
• Rendimento: 350-400m²/18L

🌟 **Coral** - Tradição e inovação
• Linha Coralar Eco com baixo odor
• Sistema tintométrico preciso
• Rendimento: 320-380m²/18L

**Tipos de tinta:**
🏠 Acrílica fosca (interna)
💧 Acrílica acetinada (lavável)
🌦️ Acrílica semi-brilho (externa)

Qual ambiente você vai pintar? Interno ou externo?`,
        quickReplies: [
          '🏠 Ambiente interno',
          '🌦️ Área externa',
          '🛁 Área úmida',
          '🎨 Quero cores especiais'
        ]
      };
    }

    // Textures
    if (message.match(/textura|grafiato|massa corrida|reboco/i)) {
      return {
        text: `🏠 Texturas para dar personalidade às suas paredes!

**Tipos de textura:**
🎭 **Grafiato**
• Textura clássica e elegante
• Várias granulometrias
• R$ 45,90/18kg (rende 50-60m²)

🌊 **Textura Risca**
• Efeito riscado moderno
• Fácil aplicação
• R$ 38,90/18kg (rende 45-55m²)

✨ **Textura Lisa (Massa Corrida)**
• Acabamento liso perfeito
• Base para pintura
• R$ 29,90/18kg (rende 80-100m²)

🎨 **Efeitos Especiais:**
• Cimento queimado
• Marmorizado
• Pedra São Tomé

Que tipo de efeito você quer nas paredes?`,
        quickReplies: [
          '🎭 Grafiato tradicional',
          '🌊 Textura moderna',
          '✨ Parede lisa',
          '🎨 Efeitos especiais'
        ]
      };
    }

    // Varnishes and sealers
    if (message.match(/verniz|selador|primer|madeira|metal/i)) {
      return {
        text: `🌟 Vernizes e seladores para proteção duradoura!

**Para madeira:**
🌲 **Verniz Marítimo**
• Proteção UV + umidade
• Acabamento brilhante ou fosco
• R$ 89,90/3,6L

🪵 **Stain (Impregnante)**
• Realça os veios da madeira
• Várias cores disponíveis
• R$ 45,90/900ml

**Para metal:**
🔩 **Zarcão**
• Primer anticorrosivo
• Base para esmalte
• R$ 35,90/3,6L

⚡ **Tinta Ferrolac**
• Esmalte sintético 3 em 1
• Direto sobre ferrugem
• R$ 67,90/3,6L

Qual tipo de superfície você vai proteger?`,
        quickReplies: [
          '🌲 Madeira externa',
          '🏠 Madeira interna',
          '🔩 Metal/ferro',
          '🏗️ Estruturas'
        ]
      };
    }

    // Project calculation
    if (message.match(/área|metro|m²|quantidade|orçamento/i)) {
      return {
        text: `📏 Vamos calcular o material necessário!

**Para cálculo preciso, preciso saber:**
• Área total das paredes (m²)
• Tipo de acabamento desejado
• Condições atuais da parede
• Cores escolhidas

**Exemplo para 100m² de parede:**
🎨 **Só pintura:** R$ 380-580
• Tinta acrílica 18L + primer
• Rolo, pincel e acessórios

🏠 **Com textura:** R$ 680-980
• Massa corrida + tinta
• Material para textura
• Ferramentas específicas

Quer que eu faça um orçamento personalizado? Qual a área aproximada?`,
        quickReplies: [
          '🏠 50-100m²',
          '🏠 100-200m²',
          '🏢 Mais de 200m²',
          '📐 Não sei a área'
        ]
      };
    }

    // Color consultation
    if (message.match(/cor|cores|combinação|decoração|ambiente/i)) {
      return {
        text: `🎨 Consultoria de cores sem custo adicional!

**Tendências 2024:**
🤍 **Cores neutras** - Off-white, bege, cinza claro
🌿 **Verde sage** - Tranquilidade e natureza
💙 **Azul petróleo** - Sofisticação e elegância
🧡 **Terracota** - Aconchego e personalidade

**Dicas de combinação:**
• Parede principal: Cor de destaque
• Demais paredes: Tom neutro
• Teto: Sempre mais claro
• Rodapé: Contraste sutil

**Serviços inclusos:**
✅ Consulta de cores grátis
✅ Teste de cor na parede
✅ Catálogo completo
✅ Orientação técnica

Que estilo você busca? Moderno, clássico, aconchegante?`,
        quickReplies: [
          '✨ Moderno minimalista',
          '🏛️ Clássico elegante',
          '🏠 Aconchegante',
          '🌈 Cores vibrantes'
        ]
      };
    }

    // Professional services
    if (message.match(/pintor|aplicação|mão de obra|serviço/i)) {
      return {
        text: `🔧 Temos equipe de pintores profissionais!

**Serviço completo:**
👨‍🎨 **Pintores certificados**
• Experiência mínima de 5 anos
• Trabalho limpo e organizado
• Garantia de 2 anos

📋 **Processo profissional:**
1️⃣ Preparação das superfícies
2️⃣ Proteção de móveis e pisos
3️⃣ Aplicação de primer
4️⃣ Pintura com técnica adequada
5️⃣ Limpeza e entrega

💰 **Valores da mão de obra:**
• Pintura simples: R$ 12-18/m²
• Com textura: R$ 18-25/m²
• Efeitos especiais: R$ 25-35/m²

Quer orçamento completo (material + mão de obra)?`,
        quickReplies: [
          '✅ Orçamento completo',
          '🎨 Só material',
          '👨‍🎨 Só mão de obra',
          '📅 Agendar visita'
        ]
      };
    }

    // Default helpful response
    return {
      text: `Temos tudo para o acabamento perfeito! 🎨

**Nossos diferenciais:**
1️⃣ **Variedade** - Todas as marcas e tipos
2️⃣ **Consultoria** - Ajuda na escolha de cores
3️⃣ **Qualidade** - Produtos premium
4️⃣ **Serviço** - Equipe profissional

O que você quer realçar no seu ambiente? Elegância, aconchego, modernidade ou personalidade?`,
      quickReplies: [
        '✨ Elegância',
        '🏠 Aconchego',
        '🎯 Modernidade',
        '🎨 Personalidade'
      ]
    };
  }
}