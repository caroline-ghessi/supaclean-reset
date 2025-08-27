import { ProjectContext } from '@/types/conversation.types';

export class InformationExtractor {
  async extractFromConversation(
    messages: Array<{ content: string; sender_type: string }>,
    currentContext?: Partial<ProjectContext>
  ): Promise<Partial<ProjectContext>> {
    const allText = messages
      .filter(m => m.sender_type === 'customer')
      .map(m => m.content)
      .join(' ');

    const extracted: Partial<ProjectContext> = {
      ...currentContext,
    };

    // Extract personal info
    extracted.whatsapp_confirmed = this.extractPhone(allText) || currentContext?.whatsapp_confirmed;

    // Extract energy specific
    if (allText.match(/energia|solar|painel/i)) {
      extracted.energy_consumption = this.extractEnergyConsumption(allText) || currentContext?.energy_consumption;
      extracted.energy_bill_value = this.extractMoneyValue(allText) || currentContext?.energy_bill_value;
      extracted.has_energy_backups = this.detectBackupIntent(allText) ?? currentContext?.has_energy_backups;
    }

    // Extract roof specific
    if (allText.match(/telha|telhado|shingle/i)) {
      extracted.roof_status = this.extractRoofStatus(messages) || currentContext?.roof_status;
      extracted.roof_size_m2 = this.extractArea(allText) || currentContext?.roof_size_m2;
    }

    // Extract steel frame specific
    if (allText.match(/steel|estrutura|construção/i)) {
      extracted.has_architectural_project = this.detectProjectStatus(allText) ?? currentContext?.has_architectural_project;
      extracted.construction_size_m2 = this.extractArea(allText) || currentContext?.construction_size_m2;
    }

    // Extract general project info
    extracted.urgency = this.detectUrgency(allText) || currentContext?.urgency;
    extracted.budget_range = this.extractBudgetRange(allText) || currentContext?.budget_range;
    extracted.materials_list = this.extractMaterialsList(allText) || currentContext?.materials_list;
    extracted.desired_product = this.extractSpecificProduct(allText) || currentContext?.desired_product;

    return extracted;
  }

  private extractPhone(text: string): string | undefined {
    const phoneRegex = /(\(?\d{2}\)?\s?9?\d{4}-?\d{4})/g;
    const match = text.match(phoneRegex);
    return match?.[0]?.replace(/\D/g, '');
  }

  private extractEnergyConsumption(text: string): string | undefined {
    // Patterns like "300 kwh", "500kwh", "conta de 400"
    const patterns = [
      /(\d+)\s*kwh/i,
      /conta\s+de?\s+r?\$?\s*(\d+)/i,
      /r?\$?\s*(\d+)\s*(?:reais|de conta)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] + ' kWh';
      }
    }

    return undefined;
  }

  private extractMoneyValue(text: string): number | undefined {
    const moneyRegex = /R?\$?\s*(\d+(?:[.,]\d+)?)/g;
    const matches = text.matchAll(moneyRegex);
    
    for (const match of matches) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (value > 50 && value < 100000) { // Reasonable range
        return value;
      }
    }

    return undefined;
  }

  private extractRoofStatus(
    messages: Array<{ content: string; sender_type: string }>
  ): 'nova_construcao' | 'reforma' | undefined {
    let hasMentionedRoof = false;

    for (const msg of messages) {
      if (msg.sender_type !== 'customer') continue;
      
      const content = msg.content.toLowerCase();
      
      if (content.match(/telha|telhado|shingle|cobertura/)) {
        hasMentionedRoof = true;
      }

      if (hasMentionedRoof) {
        if (content.match(/nova|construção nova|construir|construindo/)) {
          return 'nova_construcao';
        }
        if (content.match(/reforma|trocar|substituir|reformar|troca/)) {
          return 'reforma';
        }
      }
    }

    return undefined;
  }

  private detectProjectStatus(text: string): boolean | undefined {
    if (text.match(/tenho projeto|projeto pronto|arquiteto já fez/i)) {
      return true;
    }
    if (text.match(/não tenho projeto|sem projeto|preciso de projeto/i)) {
      return false;
    }
    return undefined;
  }

  private detectBackupIntent(text: string): boolean {
    return Boolean(
      text.match(/bateria|backup|nobreak|sem luz|falta de energia|autonomia/i)
    );
  }

  private extractArea(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*m²/i,
      /(\d+)\s*metros?\s*quadrados?/i,
      /área\s+de?\s+(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    return undefined;
  }

  private detectUrgency(text: string): 'low' | 'medium' | 'high' | undefined {
    if (text.match(/urgente|hoje|agora|imediato|emergência/i)) {
      return 'high';
    }
    if (text.match(/essa semana|próximos dias|logo|breve/i)) {
      return 'medium';
    }
    if (text.match(/sem pressa|quando puder|futuramente/i)) {
      return 'low';
    }
    return undefined;
  }

  private extractBudgetRange(text: string): string | undefined {
    const values: number[] = [];
    const moneyRegex = /R?\$?\s*(\d+(?:[.,]\d+)?(?:\.\d{3})*)/g;
    const matches = text.matchAll(moneyRegex);
    
    for (const match of matches) {
      const value = parseFloat(
        match[1].replace(/\./g, '').replace(',', '.')
      );
      if (value > 100) { // Ignore small values
        values.push(value);
      }
    }

    if (values.length === 0) return undefined;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    if (min === max) {
      return `~R$ ${min.toLocaleString('pt-BR')}`;
    }
    
    return `R$ ${min.toLocaleString('pt-BR')} - R$ ${max.toLocaleString('pt-BR')}`;
  }

  private extractMaterialsList(text: string): string[] | undefined {
    // Look for lists with multiple items
    const listPatterns = [
      /preciso de:?\s*([^.]+)/i,
      /quero:?\s*([^.]+)/i,
      /lista:?\s*([^.]+)/i,
    ];

    for (const pattern of listPatterns) {
      const match = text.match(pattern);
      if (match) {
        const items = match[1]
          .split(/[,;e]/)
          .map(item => item.trim())
          .filter(item => item.length > 2);
        
        if (items.length > 1) {
          return items;
        }
      }
    }

    return undefined;
  }

  private extractSpecificProduct(text: string): string | undefined {
    // Look for specific product mentions with model/brand
    const productPatterns = [
      /makita\s+[a-z0-9]+/i,
      /dewalt\s+[a-z0-9]+/i,
      /modelo\s+([a-z0-9]+)/i,
      /código\s+([a-z0-9]+)/i,
    ];

    for (const pattern of productPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }
}