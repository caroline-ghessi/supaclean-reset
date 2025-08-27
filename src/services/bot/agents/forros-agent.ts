import { BaseAgent, AgentResponse, ConversationWithContext } from './base-agent';

export class ForrosAgent extends BaseAgent {
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
        text: `${this.getGreeting()}! ✨ Forros e rebaixamentos especiais! 

Gesso, PVC, fibra mineral e drywall. Soluções para esconder instalações e criar ambientes incríveis.

Que tipo de forro você precisa?`,
        quickReplies: [
          '🌟 Forro de gesso',
          '💧 Forro de PVC', 
          '🏢 Forro modular',
          '💡 Com iluminação'
        ]
      };
    }

    // Gypsum ceiling
    if (message.match(/gesso|rebaixamento|moldura|sanca/i)) {
      return {
        text: `🌟 Forro de gesso é nossa especialidade!

**Tipos de forro em gesso:**
✨ **Forro Liso**
• Acabamento perfeito
• Esconde todas as instalações
• A partir de R$ 35/m²

💡 **Forro com Sancas**
• Iluminação indireta embutida
• Design sofisticado
• A partir de R$ 45/m²

🎨 **Forros Decorativos**
• Molduras e relevos
• Personalização total
• A partir de R$ 55/m²

**Vantagens do gesso:**
• Isolamento térmico
• Absorção acústica
• Resistente ao fogo
• Durabilidade de 20+ anos

Para qual ambiente é o forro?`,
        quickReplies: [
          '🛋️ Sala de estar',
          '🛏️ Quarto',
          '🍽️ Cozinha',
          '🏢 Comercial'
        ]
      };
    }

    // PVC ceiling
    if (message.match(/pvc|plástico|úmida|banheiro|cozinha/i)) {
      return {
        text: `💧 Forro de PVC é perfeito para áreas úmidas!

**Vantagens do PVC:**
🌊 **Resistente à umidade** - Ideal para banheiros
🧼 **Fácil limpeza** - Só água e sabão
🔧 **Manutenção simples** - Acesso às instalações
💰 **Custo-benefício** - Preço acessível

**Modelos disponíveis:**
🤍 **PVC Branco Liso** - R$ 18/m²
🎨 **PVC Colorido** - R$ 22/m²
🌳 **PVC Madeirado** - R$ 25/m²
💎 **PVC Fosco Premium** - R$ 28/m²

**Instalação:**
• Estrutura metálica
• Painéis encaixáveis
• Prazo: 1-2 dias

Qual área úmida você quer revestir?`,
        quickReplies: [
          '🛁 Banheiro',
          '🍽️ Cozinha',
          '🧺 Área de serviço',
          '🏊‍♂️ Área da piscina'
        ]
      };
    }

    // Modular ceiling
    if (message.match(/modular|fibra|mineral|removível|escritório/i)) {
      return {
        text: `🏢 Forro modular para ambientes profissionais!

**Tipos modulares:**
🔲 **Fibra Mineral 625x625mm**
• Absorção acústica superior
• Resistente à umidade
• R$ 25/m² + estrutura

⭐ **Tegular 625x625mm**
• Bordas rebaixadas
• Visual sofisticado
• R$ 32/m² + estrutura

🌟 **Lay-in 625x625mm**
• Bordas planas
• Fácil manutenção
• R$ 28/m² + estrutura

**Vantagens:**
✅ Acesso total às instalações
✅ Absorção acústica
✅ Resistência ao fogo
✅ Instalação rápida
✅ Substituição individual

Para que tipo de ambiente comercial?`,
        quickReplies: [
          '💼 Escritório',
          '🏥 Clínica/consultório',
          '🛍️ Loja',
          '🏭 Industrial'
        ]
      };
    }

    // Lighting integration
    if (message.match(/iluminação|led|spot|luminária|luz/i)) {
      return {
        text: `💡 Forros com iluminação integrada!

**Opções de iluminação:**
🌟 **Spots de Embutir**
• LED 7W ou 12W
• Luz branca ou amarela
• R$ 35-65 por spot

💡 **Fita LED**
• Iluminação indireta
• Várias cores disponíveis
• R$ 25-45/metro linear

🔆 **Luminárias Embutidas**
• Para escritórios (60x60cm)
• LED tubular T8
• R$ 85-150 por luminária

**Projetos especiais:**
• Sancas com luz indireta
• Rasgos de luz no gesso
• Spots direcionáveis
• Dimmer para controle

Que tipo de iluminação você prefere?`,
        quickReplies: [
          '🌟 Spots pontuais',
          '💡 Luz indireta',
          '🔆 Luminária embutida',
          '🎨 Projeto especial'
        ]
      };
    }

    // Area calculation
    if (message.match(/área|metro|m²|orçamento|preço/i)) {
      return {
        text: `📏 Vamos calcular seu forro!

**Para orçamento preciso, informações importantes:**
• Área total do ambiente (m²)
• Pé direito atual
• Tipo de forro desejado
• Necessidade de iluminação

**Exemplo para 20m²:**
🌟 **Gesso liso:** R$ 700-900
💧 **PVC branco:** R$ 500-700
🏢 **Modular fibra:** R$ 800-1200

**Incluso no serviço:**
✅ Material completo
✅ Estrutura de sustentação
✅ Mão de obra especializada
✅ Acabamento perfeito
✅ Limpeza pós-obra

Qual a área aproximada do seu ambiente?`,
        quickReplies: [
          '🏠 10-20m²',
          '🏠 20-40m²',
          '🏢 40-80m²',
          '📐 Preciso medir'
        ]
      };
    }

    // Installation process
    if (message.match(/instalação|como instala|prazo|obra/i)) {
      return {
        text: `🔧 Processo de instalação profissional!

**Etapas da instalação:**
1️⃣ **Medição e projeto** (1 dia)
2️⃣ **Marcação dos pontos** 
3️⃣ **Instalação da estrutura**
4️⃣ **Colocação do forro**
5️⃣ **Acabamentos finais**
6️⃣ **Limpeza e entrega**

**Prazos típicos:**
⚡ Até 20m²: 1-2 dias
🏠 20-50m²: 2-3 dias
🏢 Acima de 50m²: 3-5 dias

**Cuidados especiais:**
• Proteção de móveis
• Trabalho limpo
• Horário comercial
• Equipe certificada

**Garantia:** 2 anos na mão de obra

Precisa de algum cuidado especial durante a obra?`,
        quickReplies: [
          '🏠 Mora no local',
          '🏢 Ambiente funcionando',
          '📅 Prazo específico',
          '✅ Sem restrições'
        ]
      };
    }

    // Default helpful response
    return {
      text: `Transforme seu ambiente com forros incríveis! ✨

**Nossos diferenciais:**
1️⃣ **Variedade** - Gesso, PVC, modular e especiais
2️⃣ **Qualidade** - Materiais premium e duráveis
3️⃣ **Instalação** - Equipe especializada
4️⃣ **Projeto** - Soluções personalizadas

Qual é seu objetivo principal? Esconder instalações, melhorar acústica, criar ambientes ou economizar?`,
      quickReplies: [
        '🔌 Esconder instalações',
        '🔇 Melhorar acústica',
        '🎨 Decorar ambiente',
        '💰 Solução econômica'
      ]
    };
  }
}