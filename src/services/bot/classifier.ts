import { ProductCategory } from '@/types/conversation.types';

export class IntentClassifier {
  private readonly keywordMap = {
    telha_shingle: [
      'telha', 'telhado', 'shingle', 'cobertura', 'telhado dos sonhos',
      'owens corning', 'iko', 'reforma telhado'
    ],
    energia_solar: [
      'solar', 'energia', 'painel', 'painéis', 'bateria', 'backup',
      'inversor', 'conta de luz', 'energia limpa', 'fotovoltaico',
      'kwp', 'geração'
    ],
    steel_frame: [
      'steel frame', 'steel', 'estrutura metálica', 'construção seca',
      'estrutura de aço', 'lsf', 'light steel'
    ],
    drywall_divisorias: [
      'drywall', 'dry wall', 'placa', 'chapa', 'divisória', 'parede',
      'gesso', 'acartonado', 'st', 'ru', 'rf', 'knauf', 'placo'
    ],
    ferramentas: [
      'furadeira', 'parafusadeira', 'makita', 'dewalt', 'serra',
      'ferramenta', 'máquina', 'esmerilhadeira', 'lixadeira',
      'martelete', 'kit ferramenta'
    ],
    pisos: [
      'piso', 'vinílico', 'laminado', 'carpete', 'manta', 'rodapé',
      'porcelanato', 'cerâmica', 'revestimento'
    ],
    acabamentos: [
      'tinta', 'textura', 'massa corrida', 'selador', 'verniz',
      'santa luzia', 'acabamento'
    ],
    forros: [
      'forro', 'gesso', 'pvc', 'modular', 'rebaixamento'
    ],
    saudacao: [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
      'hello', 'hey'
    ],
    institucional: [
      'onde fica', 'endereço', 'localização', 'horário', 'telefone',
      'quem são', 'sobre a empresa', 'drystore'
    ]
  };

  private readonly contextualPatterns = {
    urgente: /urgente|hoje|agora|rápido|imediato|emergência/i,
    orcamento: /preço|valor|quanto|orçamento|custo|investimento/i,
    grande_projeto: /obra|construção|prédio|condomínio|empresarial/i,
  };

  async classifyIntent(
    message: string, 
    currentCategory: ProductCategory | null,
    conversationHistory: string[]
  ): Promise<{
    category: ProductCategory;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const normalizedMessage = this.normalizeText(message);
    
    // Se já tem categoria definida e não é saudação/institucional
    if (currentCategory && 
        !['saudacao', 'institucional', 'indefinido'].includes(currentCategory)) {
      
      // Verifica se há mudança clara de categoria
      const newCategory = this.detectCategoryChange(normalizedMessage);
      
      if (newCategory && newCategory !== currentCategory) {
        return {
          category: newCategory,
          confidence: 0.9,
          entities: this.extractEntities(message)
        };
      }
      
      // Mantém categoria atual
      return {
        category: currentCategory,
        confidence: 0.95,
        entities: this.extractEntities(message)
      };
    }

    // Classificação inicial
    const scores = this.calculateCategoryScores(normalizedMessage);
    const topCategory = this.getTopCategory(scores);

    return {
      category: topCategory.category,
      confidence: topCategory.confidence,
      entities: this.extractEntities(message)
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateCategoryScores(text: string): Map<ProductCategory, number> {
    const scores = new Map<ProductCategory, number>();

    for (const [category, keywords] of Object.entries(this.keywordMap)) {
      let score = 0;
      
      for (const keyword of keywords) {
        const normalizedKeyword = this.normalizeText(keyword);
        
        // Exact match = 10 points
        if (text === normalizedKeyword) {
          score += 10;
        }
        // Contains keyword = 5 points
        else if (text.includes(normalizedKeyword)) {
          score += 5;
        }
        // Word boundary match = 3 points
        else if (new RegExp(`\\b${normalizedKeyword}\\b`).test(text)) {
          score += 3;
        }
      }
      
      scores.set(category as ProductCategory, score);
    }

    return scores;
  }

  private getTopCategory(scores: Map<ProductCategory, number>): {
    category: ProductCategory;
    confidence: number;
  } {
    let topCategory: ProductCategory = 'indefinido';
    let maxScore = 0;

    scores.forEach((score, category) => {
      if (score > maxScore) {
        maxScore = score;
        topCategory = category;
      }
    });

    // Calculate confidence based on score
    const confidence = Math.min(maxScore / 20, 1); // Normalize to 0-1

    return {
      category: topCategory,
      confidence: confidence > 0.3 ? confidence : 0.3
    };
  }

  private detectCategoryChange(text: string): ProductCategory | null {
    const scores = this.calculateCategoryScores(text);
    const top = this.getTopCategory(scores);
    
    return top.confidence > 0.6 ? top.category : null;
  }

  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract urgency
    if (this.contextualPatterns.urgente.test(message)) {
      entities.urgency = 'high';
    }

    // Extract budget intent
    if (this.contextualPatterns.orcamento.test(message)) {
      entities.wantsBudget = true;
    }

    // Extract project size
    if (this.contextualPatterns.grande_projeto.test(message)) {
      entities.projectSize = 'large';
    }

    // Extract phone numbers
    const phoneRegex = /(\(?\d{2}\)?\s?9?\d{4}-?\d{4})/g;
    const phones = message.match(phoneRegex);
    if (phones) {
      entities.phone = phones[0];
    }

    // Extract email
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = message.match(emailRegex);
    if (emails) {
      entities.email = emails[0];
    }

    // Extract numbers (for quantities, measures, etc)
    const numberRegex = /\d+([.,]\d+)?/g;
    const numbers = message.match(numberRegex);
    if (numbers) {
      entities.numbers = numbers.map(n => parseFloat(n.replace(',', '.')));
    }

    return entities;
  }
}