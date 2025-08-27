import { BaseAgent, AgentResponse, ConversationWithContext } from './base-agent';

export class PisosAgent extends BaseAgent {
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
        text: `${this.getGreeting()}! 🏠 Pisos e revestimentos de qualidade! 

Temos vinílico, laminado, carpete, mantas e todos os acabamentos. Para residencial e comercial.

Que tipo de piso você está procurando?`,
        quickReplies: [
          '💎 Piso vinílico',
          '🌿 Piso laminado', 
          '🧸 Carpete e mantas',
          '🏢 Para comércio'
        ]
      };
    }

    // Vinyl flooring
    if (message.match(/vinílico|vinil|click|colado/i)) {
      return {
        text: `💎 Piso vinílico é nossa especialidade! Moderno, resistente e prático!

**Tipos disponíveis:**
🔗 **Vinílico Click** (mais vendido)
• Instalação sem cola - encaixe perfeito
• Resistente à água
• Várias texturas (madeira, pedra, concreto)
• A partir de R$ 39,90/m²

🏠 **Vinílico Colado**
• Maior durabilidade
• Ideal para tráfego intenso
• Acabamento liso
• A partir de R$ 29,90/m²

Qual ambiente você vai revestir? Quarto, sala, cozinha ou banheiro?`,
        quickReplies: [
          '🛏️ Quartos',
          '🛋️ Sala de estar',
          '🍽️ Cozinha',
          '🏠 Casa inteira'
        ]
      };
    }

    // Laminate flooring
    if (message.match(/laminado|madeira|eucafloor|durafloor/i)) {
      return {
        text: `🌿 Piso laminado é elegante e aconchegante!

**Marcas premium:**
🏆 **Eucafloor** - Líder no Brasil
• Linha New Elegance AC4
• Resistência comercial
• 15 anos de garantia
• R$ 49,90 a R$ 89,90/m²

🌟 **Durafloor** - Tecnologia alemã  
• Linha Studio com trava click
• Textura ultra-realística
• Resistente a riscos
• R$ 39,90 a R$ 79,90/m²

**Classes de resistência:**
• AC3: Residencial intenso
• AC4: Comercial leve  
• AC5: Comercial pesado

Que cor/estilo você prefere? Clara, escura ou tom natural?`,
        quickReplies: [
          '🤍 Tons claros',
          '🤎 Tons escuros',
          '🌿 Tom natural',
          '🏠 Ver todos os modelos'
        ]
      };
    }

    // Carpet and mats
    if (message.match(/carpete|manta|tapete|feltro/i)) {
      return {
        text: `🧸 Carpetes e mantas para conforto e aconchego!

**Carpetes residenciais:**
🏠 **Carpete Frisado**
• Confortável e durável
• Várias cores disponíveis
• R$ 19,90 a R$ 39,90/m²

🌟 **Carpete Bouclê**
• Textura diferenciada
• Resistente ao desgaste
• R$ 24,90 a R$ 49,90/m²

**Mantas vinílicas:**
💧 **Manta Hospitalar**
• Resistente à água
• Fácil limpeza
• Ideal para clínicas
• R$ 15,90 a R$ 29,90/m²

Para que ambiente é o carpete? Quarto, escritório ou comercial?`,
        quickReplies: [
          '🛏️ Quarto infantil',
          '💼 Escritório',
          '🏥 Área comercial',
          '🎭 Salão de festas'
        ]
      };
    }

    // Commercial flooring
    if (message.match(/comercial|empresa|loja|escritório|alto tráfego/i)) {
      return {
        text: `🏢 Pisos comerciais de alta resistência!

**Soluções profissionais:**

💼 **Para escritórios:**
• Carpete Placa - R$ 18,90/m²
• Vinílico comercial - R$ 45,90/m²
• Laminado AC5 - R$ 69,90/m²

🛍️ **Para lojas:**
• Vinílico rígido - R$ 52,90/m²
• Manta condutiva - R$ 35,90/m²
• Porcelanato - R$ 39,90/m²

🏥 **Para clínicas/hospitais:**
• Manta hospitalar - R$ 29,90/m²
• Vinílico bactericida - R$ 49,90/m²

Qual tipo de estabelecimento comercial é o seu?`,
        quickReplies: [
          '💼 Escritório',
          '🛍️ Loja/comércio',
          '🏥 Clínica/consultório',
          '🍽️ Restaurante'
        ]
      };
    }

    // Area calculation and pricing
    if (context.floor_quantity_m2 || message.match(/área|metro|m²|orçamento/i)) {
      const area = context.floor_quantity_m2 || 50;
      const avgPrice = 45; // Average price per sqm
      const estimatedCost = area * avgPrice;
      
      return {
        text: `Para ${area}m² temos várias opções excelentes!

💰 **Estimativa de investimento:**
🥉 **Econômico:** ${this.formatCurrency(area * 25)} (R$ 25/m²)
🥈 **Intermediário:** ${this.formatCurrency(area * 45)} (R$ 45/m²)  
🥇 **Premium:** ${this.formatCurrency(area * 75)} (R$ 75/m²)

📦 **Incluso no serviço:**
• Material escolhido + sobras (5%)
• Rodapé e/ou perfis de acabamento
• Manta acústica (se necessário)
• Mão de obra especializada

⏱️ **Prazo de instalação:** 1-3 dias

Quer agendar uma visita para escolher o material e fazer orçamento exato?`,
        quickReplies: [
          '✅ Agendar visita',
          '💰 Opção econômica',
          '🌟 Opção premium',
          '📋 Orçamento detalhado'
        ]
      };
    }

    // Installation and technical
    if (message.match(/instalação|instalar|como instala|mão de obra/i)) {
      return {
        text: `🔧 Nossa instalação é diferenciada!

**Processo profissional:**
1️⃣ **Preparação:** Limpeza e nivelamento do contrapiso
2️⃣ **Manta:** Instalação de manta acústica (quando necessário)
3️⃣ **Piso:** Instalação com ferramentas profissionais
4️⃣ **Acabamento:** Rodapés e perfis de transição
5️⃣ **Limpeza:** Limpeza final e entrega

**Garantias:**
✅ Material: Conforme fabricante (5-15 anos)
✅ Instalação: 2 anos
✅ Equipe: Certificada e experiente

**Prazos:**
• Até 30m²: 1 dia
• 30-60m²: 2 dias
• Acima de 60m²: 2-3 dias

O contrapiso está pronto ou precisa de preparação?`,
        quickReplies: [
          '✅ Contrapiso pronto',
          '🔨 Precisa preparar',
          '❓ Não sei o estado',
          '📞 Quero vistoria'
        ]
      };
    }

    // Default helpful response
    return {
      text: `Temos a solução perfeita para seu piso! 🏠

**Nossas especialidades:**
1️⃣ **Variedade** - Todos os tipos e marcas
2️⃣ **Qualidade** - Marcas reconhecidas no mercado
3️⃣ **Instalação** - Equipe própria certificada
4️⃣ **Garantia** - Tranquilidade total

Qual tipo de piso mais combina com você? Prático, elegante, confortável ou resistente?`,
      quickReplies: [
        '💎 Prático (vinílico)',
        '🌿 Elegante (laminado)',
        '🧸 Confortável (carpete)',
        '🏢 Resistente (comercial)'
      ]
    };
  }
}