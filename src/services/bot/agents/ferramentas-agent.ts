import { BaseAgent, AgentResponse } from './base-agent';
import { Conversation, ProjectContext } from '@/types/conversation.types';

export class FerramentasAgent extends BaseAgent {
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
        text: `${this.getGreeting()}! 🔧 Ferramentas profissionais é conosco! 

Temos as melhores marcas: Makita, DeWalt, Bosch, Stanley e muito mais. Para profissionais e uso doméstico.

Que tipo de ferramenta você está procurando?`,
        quickReplies: [
          '🔨 Furadeiras e parafusadeiras',
          '⚡ Ferramentas elétricas', 
          '🧰 Kit completo',
          '🏠 Para uso doméstico'
        ]
      };
    }

    // Drills and screwdrivers
    if (message.match(/furadeira|parafusadeira|perfuração|parafuso/i)) {
      return {
        text: `🔨 Furadeiras e parafusadeiras são nossos carros-chefe!

**Marcas disponíveis:**
⚡ **Makita** - Linha profissional de 12V a 18V
🔋 **DeWalt** - Baterias de longa duração
🔧 **Bosch** - Precisão alemã para profissionais
💪 **Stanley** - Custo-benefício excelente

**Tipos:**
• Furadeira de impacto
• Parafusadeira simples  
• Martelete perfurador
• Furadeira angular

Você é profissional da construção ou para uso doméstico?`,
        quickReplies: [
          '👷 Uso profissional',
          '🏠 Uso doméstico',
          '💰 Melhor custo-benefício',
          '⚡ Mais potente'
        ]
      };
    }

    // Professional vs domestic use
    if (message.match(/profissional|obra|construção|pedreiro|marceneiro/i)) {
      return {
        text: `Perfeito! Para uso profissional temos as melhores opções! 👷‍♂️

**Linha Profissional recomendada:**

🏆 **Makita DHP484 (18V)**
• Furadeira de impacto sem fio
• 2 baterias + carregador + maleta
• Garantia 3 anos
• **R$ 899,90** (12x sem juros)

⚡ **DeWalt DCD771 (20V MAX)**  
• Kit com furadeira + parafusadeira
• Bateria íon-lítio de alta duração
• **R$ 749,90** (10x sem juros)

Qual tipo de trabalho você faz mais? Concreto, madeira, metal ou uso geral?`,
        quickReplies: [
          '🧱 Concreto e alvenaria',
          '🪵 Madeira e marcenaria',
          '🔩 Metal e serralheria',
          '🔧 Uso geral'
        ]
      };
    }

    // Domestic use
    if (message.match(/doméstico|casa|hobby|eventual|caseiro/i)) {
      return {
        text: `Para uso doméstico temos opções excelentes! 🏠

**Linha Doméstica recomendada:**

💡 **Bosch GSR 120-LI (12V)**
• Parafusadeira compacta
• Perfeita para móveis e quadros
• **R$ 299,90** (6x sem juros)

🔋 **Stanley SCD12S2 (12V)**
• Furadeira com 2 baterias
• Kit com brocas e bits
• **R$ 189,90** (5x sem juros)

🧰 **Kit Makita Doméstico**
• Furadeira + micro retífica + lanterna
• Maleta organizadora
• **R$ 449,90** (8x sem juros)

Qual projeto você tem em mente?`,
        quickReplies: [
          '🖼️ Pendurar quadros',
          '🪑 Montar móveis',
          '🔧 Reparos gerais',
          '🧰 Kit completo'
        ]
      };
    }

    // Electric tools
    if (message.match(/elétrica|serra|esmerilhadeira|lixadeira|aspirador/i)) {
      return {
        text: `⚡ Ferramentas elétricas profissionais! 

**Nossas principais categorias:**

🪚 **Serras:**
• Serra circular Makita 7¼" - R$ 459,90
• Serra tico-tico Bosch - R$ 389,90
• Serra mármore DeWalt - R$ 649,90

⚙️ **Esmerilhadeiras:**
• Makita 4½" 840W - R$ 299,90
• Bosch 7" 2200W - R$ 459,90

🎨 **Lixadeiras:**
• Orbital Makita - R$ 329,90
• Roto-orbital Bosch - R$ 389,90

💨 **Aspiradores:**
• Aspirador de pó Electrolux - R$ 299,90

Qual ferramenta específica você precisa?`,
        quickReplies: [
          '🪚 Serras',
          '⚙️ Esmerilhadeiras',
          '🎨 Lixadeiras',
          '💰 Promoções'
        ]
      };
    }

    // Specific brands
    if (message.match(/makita|dewalt|bosch|stanley/i)) {
      const brand = message.match(/makita/i) ? 'Makita' :
                   message.match(/dewalt/i) ? 'DeWalt' :
                   message.match(/bosch/i) ? 'Bosch' : 'Stanley';
      
      return {
        text: `${brand} é uma excelente escolha! 🏆

**Por que escolher ${brand}:**
${brand === 'Makita' ? '• Líder mundial em ferramentas\n• Tecnologia japonesa de precisão\n• Baterias intercambiáveis\n• Garantia de 3 anos' :
  brand === 'DeWalt' ? '• Marca americana profissional\n• Baterias de longa duração\n• Resistente a impactos\n• Garantia de 3 anos' :
  brand === 'Bosch' ? '• Qualidade alemã comprovada\n• Tecnologia de ponta\n• Linha profissional e hobby\n• Garantia de 2 anos' :
  '• Marca centenária confiável\n• Excelente custo-benefício\n• Linha completa\n• Garantia de 1 ano'}

**Produtos ${brand} em destaque:**
• Furadeiras e parafusadeiras
• Serras e esmerilhadeiras  
• Kits e maletas
• Acessórios originais

Quer ver nossa linha completa ${brand} ou algum produto específico?`,
        quickReplies: [
          `🔧 Linha ${brand} completa`,
          '💰 Promoções',
          '🛒 Fazer pedido',
          '📞 Falar com vendedor'
        ]
      };
    }

    // Default helpful response
    return {
      text: `Temos tudo em ferramentas profissionais! 🔧

**Nossas especialidades:**
1️⃣ **Grandes marcas** - Makita, DeWalt, Bosch
2️⃣ **Melhor preço** - Garantido do mercado
3️⃣ **Assistência técnica** - Autorizada
4️⃣ **Financiamento** - Até 12x sem juros

O que você está procurando especificamente? Posso te ajudar a escolher a ferramenta ideal!`,
      quickReplies: [
        '🔨 Furadeiras',
        '⚡ Ferramentas elétricas',
        '🧰 Kits completos',
        '💰 Promoções'
      ]
    };
  }
}