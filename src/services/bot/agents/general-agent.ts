import { BaseAgent, AgentResponse, ConversationWithContext } from './base-agent';

export class GeneralAgent extends BaseAgent {
  async generateResponse(
    message: string,
    conversationData: ConversationWithContext
  ): Promise<AgentResponse> {
    const context = conversationData.project_contexts || {};
    const contextInfo = this.extractContextualInfo(message);
    const messageCount = conversationData.messages?.length || 0;

    // Greeting flow
    if (messageCount <= 2 || message.match(/oi|olá|ola|bom dia|boa tarde|boa noite|hello|hey/i)) {
      return {
        text: `${this.getGreeting()}! 👋 Bem-vindo à **${this.companyInfo.name}**! 

Somos especialistas em soluções completas para construção civil:

🌟 **Nossas especialidades:**
${this.companyInfo.specialties.map(spec => `• ${spec}`).join('\n')}

Em que posso te ajudar hoje?`,
      };
    }

    // Company information
    if (message.match(/empresa|sobre|quem|endereço|localização|onde fica|contato|telefone/i)) {
      return {
        text: `🏢 **Informações da ${this.companyInfo.name}:**

📍 **Localização:** ${this.companyInfo.address}
📞 **Telefone:** ${this.companyInfo.phone}
🌐 **Site:** ${this.companyInfo.website}

**Nossa missão:** Ser a melhor empresa de soluções para construção civil do Rio Grande do Sul, oferecendo qualidade, inovação e atendimento excepcional.

**Diferenciais:**
✅ Mais de 10 anos no mercado
✅ Equipe técnica especializada  
✅ Marcas premium e confiáveis
✅ Atendimento personalizado
✅ Garantia em todos os serviços

**Horário de funcionamento:**
• Segunda a sexta: 8h às 18h
• Sábado: 8h às 12h

Como posso te ajudar com seu projeto?`,
      };
    }

    // Multiple categories interest
    if (message.match(/tudo|completo|casa inteira|obra completa|reforma geral/i)) {
      return {
        text: `🏠 Projeto completo! Temos tudo para sua obra!

**Pacote Casa Completa:**
🏗️ **Estrutura:** Steel Frame ou alvenaria
🏠 **Cobertura:** Telha Shingle premium
⚡ **Energia:** Sistema solar completo
🧱 **Divisórias:** Drywall para ambientes
🎨 **Acabamentos:** Pisos, tintas e forros
🔧 **Ferramentas:** Para toda a execução

**Vantagens do projeto integrado:**
💰 Desconto especial no pacote
📋 Projeto único coordenado
⏱️ Cronograma otimizado
🛡️ Garantia geral de 5 anos

Para fazer um pré-orçamento, qual é a área total da construção?`,
      };
    }

    // Budget and financing
    if (message.match(/preço|valor|quanto|orçamento|custo|financiamento|parcelamento/i)) {
      return {
        text: `💰 **Formas de pagamento flexíveis:**

**À vista:** Desconto especial de 5-10%
**Parcelado:** Até 12x sem juros no cartão
**Financiamento:** Parcerias com bancos
**Construcard:** Cartão especializado em obras

**Para orçamento personalizado:**
📋 Informamos valor exato após visita técnica
📐 Projeto personalizado para suas necessidades
💡 Sugestões para otimizar investimento
📊 Cronograma financeiro detalhado

**Nosso compromisso:**
✅ Orçamento sem compromisso
✅ Preços transparentes
✅ Sem custos ocultos
✅ Melhor custo-benefício

Qual produto ou serviço você gostaria de orçar?`,
      };
    }

    // Quality and guarantees
    if (message.match(/qualidade|garantia|certificação|confiança|segurança/i)) {
      return {
        text: `🏆 **Nossa garantia de qualidade:**

**Certificações:**
✅ Empresas parceiras certificadas
✅ Equipe técnica qualificada
✅ Materiais com selo de qualidade
✅ Processos padronizados

**Garantias oferecidas:**
🛡️ **Material:** Conforme fabricante (5-25 anos)
🔧 **Instalação:** 2-5 anos dependendo do serviço
👷 **Mão de obra:** Equipe própria certificada
📞 **Suporte:** Assistência técnica permanente

**Qualidade comprovada:**
⭐ Mais de 1000 clientes satisfeitos
📈 95% de aprovação em pesquisas
🏆 Prêmios de excelência no atendimento
🤝 Parcerias com as melhores marcas

Quer conhecer alguns projetos que já realizamos?`,
      };
    }

    // Help and support
    if (message.match(/ajuda|dúvida|não sei|como funciona|explicar/i)) {
      return {
        text: `🤝 Estou aqui para te ajudar!

**Como posso te orientar:**
💡 **Escolha de produtos:** Te ajudo a escolher a melhor solução
📊 **Orçamentos:** Explicamos todos os custos envolvidos
⏱️ **Prazos:** Informamos cronogramas realistas
🔧 **Instalação:** Explicamos todo o processo
📋 **Financiamento:** Melhores formas de pagamento

**Canais de atendimento:**
📱 WhatsApp: Atendimento imediato
📞 Telefone: ${this.companyInfo.phone}
🏢 Presencial: Visita em nossa loja
🏠 Domiciliar: Visita técnica gratuita

**Nossa equipe está pronta para:**
✅ Esclarecer todas suas dúvidas
✅ Fazer visita técnica gratuita
✅ Apresentar as melhores soluções
✅ Acompanhar seu projeto do início ao fim

Sobre qual produto você gostaria de saber mais?`,
      };
    }

    // Contact and transfer
    if (contextInfo.wantsContact || message.match(/atendente|vendedor|falar|contato|técnico/i)) {
      return {
        text: `📞 **Vou te conectar com nossa equipe especializada!**

**Para atendimento personalizado:**
• Nosso consultor vai entrar em contato
• Visita técnica gratuita se necessário
• Orçamento detalhado sem compromisso
• Acompanhamento completo do projeto

**Informações importantes:**
📱 WhatsApp atual: Confirmar se posso usar este número
⏰ Melhor horário: Para nosso consultor ligar
🏠 Endereço: Para visita técnica (se necessário)
📋 Interesse: Qual produto/serviço específico

Um consultor especializado entrará em contato em breve!`,
        shouldTransferToHuman: true
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
    };
  }
}