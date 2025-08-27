import { ProductCategory } from '@/types/conversation.types';
import { BaseAgent } from './base-agent';
import { EnergiaSolarAgent } from './energia-solar-agent';
import { TelhaShingleAgent } from './telha-shingle-agent';
import { SteelFrameAgent } from './steel-frame-agent';
import { DrywallAgent } from './drywall-agent';
import { FerramentasAgent } from './ferramentas-agent';
import { PisosAgent } from './pisos-agent';
import { AcabamentosAgent } from './acabamentos-agent';
import { ForrosAgent } from './forros-agent';
import { GeneralAgent } from './general-agent';

export class SpecializedAgentFactory {
  private agents: Map<ProductCategory, BaseAgent> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    this.agents.set('energia_solar', new EnergiaSolarAgent());
    this.agents.set('telha_shingle', new TelhaShingleAgent());
    this.agents.set('steel_frame', new SteelFrameAgent());
    this.agents.set('drywall_divisorias', new DrywallAgent());
    this.agents.set('ferramentas', new FerramentasAgent());
    this.agents.set('pisos', new PisosAgent());
    this.agents.set('acabamentos', new AcabamentosAgent());
    this.agents.set('forros', new ForrosAgent());
    
    // Default agents
    this.agents.set('saudacao', new GeneralAgent());
    this.agents.set('institucional', new GeneralAgent());
    this.agents.set('indefinido', new GeneralAgent());
  }

  getAgent(category: ProductCategory): BaseAgent {
    return this.agents.get(category) || this.agents.get('indefinido')!;
  }

  getAllAgents(): Map<ProductCategory, BaseAgent> {
    return new Map(this.agents);
  }
}