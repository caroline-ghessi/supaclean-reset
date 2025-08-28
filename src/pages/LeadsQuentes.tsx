import { useState } from 'react';
import { 
  Flame, Clock, DollarSign, TrendingUp, AlertCircle,
  PhoneCall, Send, Calendar, Zap, MessageSquare,
  User, MapPin, Target, ChevronDown, Filter
} from 'lucide-react';
import { useHotLeads, useHotLeadsStats, HotLead } from '@/hooks/useHotLeads';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function LeadsQuentes() {
  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null);
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'value' | 'activity'>('score');

  const { data: hotLeads = [], isLoading } = useHotLeads({
    urgencyFilter: filterUrgency,
    productFilter: filterProduct,
    sortBy,
  });

  const { data: stats } = useHotLeadsStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-lead-hot/5">
      {/* Header com Métricas Urgentes */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary to-lead-hot rounded-lg">
                <Flame className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Leads Quentes</h1>
                <p className="text-sm text-muted-foreground">Oportunidades prontas para fechar</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <QuickStat
                label="Aguardando"
                value={stats?.waitingCount.toString() || '0'}
                icon={<Clock className="w-4 h-4" />}
                color="text-lead-hot"
                urgent={stats?.waitingCount > 0}
              />
              <QuickStat
                label="Valor Total"
                value={`R$ ${((stats?.totalValue || 0) / 1000).toFixed(0)}k`}
                icon={<DollarSign className="w-4 h-4" />}
                color="text-green-600"
              />
              <QuickStat
                label="Taxa Conversão Hoje"
                value={`${stats?.conversionRate || 0}%`}
                icon={<TrendingUp className="w-4 h-4" />}
                color="text-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Ações Rápidas */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Toda Urgência</option>
              <option value="critical">🔴 Crítico (fechar hoje)</option>
              <option value="high">🟠 Alta (24h)</option>
              <option value="medium">🟡 Média (esta semana)</option>
            </select>

            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos Produtos</option>
              <option value="energia_solar">☀️ Energia Solar</option>
              <option value="telha_shingle">🏠 Telhas</option>
              <option value="steel_frame">🏗️ Steel Frame</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="score">Por Score</option>
              <option value="time">Mais Antigos</option>
              <option value="value">Maior Valor</option>
              <option value="activity">Última Atividade</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Distribuir Leads
            </Button>
            <Button variant="outline" size="sm">
              Exportar Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Lista de Leads */}
          <div className="col-span-5">
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-48 bg-card rounded-lg animate-pulse" />
                ))
              ) : (
                hotLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLead?.id === lead.id}
                    onClick={() => setSelectedLead(lead)}
                  />
                ))
              )}
            </div>

            {/* Load More */}
            <Button variant="outline" className="w-full mt-4 border-dashed">
              Carregar mais leads
            </Button>
          </div>

          {/* Detalhes do Lead */}
          <div className="col-span-7">
            {selectedLead ? (
              <LeadDetailPanel lead={selectedLead} />
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Flame className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Selecione um Lead
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha um lead na lista para ver detalhes e tomar ações
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadCard({ lead, isSelected, onClick }: {
  lead: HotLead;
  isSelected: boolean;
  onClick: () => void;
}) {
  const urgencyStyles = {
    critical: 'bg-lead-hot/10 border-lead-hot/30 ring-lead-hot',
    high: 'bg-primary/10 border-primary/30 ring-primary',
    medium: 'bg-lead-warm/10 border-lead-warm/30 ring-lead-warm',
  };

  const getTimeSinceLastContact = () => {
    return formatDistanceToNow(lead.lastContact, { 
      locale: ptBR, 
      addSuffix: true 
    });
  };

  return (
    <Card
      onClick={onClick}
      className={`
        p-4 border-2 cursor-pointer transition-all hover:shadow-md
        ${urgencyStyles[lead.urgency]}
        ${isSelected ? 'ring-2 shadow-lg' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=${lead.name}&background=F97316&color=fff`}
              className="w-12 h-12 rounded-full"
              alt={lead.name}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{lead.name}</h3>
            <p className="text-xs text-muted-foreground">
              {lead.city} • {getTimeSinceLastContact()}
            </p>
          </div>
        </div>
        
        {/* Score Badge */}
        <Badge className="bg-gradient-to-r from-primary to-lead-hot text-primary-foreground">
          <Flame className="w-3 h-3 mr-1" />
          {lead.score}°
        </Badge>
      </div>

      {/* Product & Value */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{lead.productIcon}</span>
          <span className="text-sm font-medium text-foreground">{lead.product}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Potencial</p>
          <p className="text-sm font-bold text-foreground">R$ {lead.estimatedValue}</p>
        </div>
      </div>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="w-3 h-3" />
          <span>{lead.messages} mensagens</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{lead.responseTime}</span>
        </div>
      </div>

      {/* Last Message Preview */}
      <div className="p-2 bg-muted/50 rounded-lg">
        <p className="text-xs text-foreground line-clamp-2">
          "{lead.lastMessage}"
        </p>
      </div>

      {/* Action Required */}
      {lead.actionRequired && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-lead-hot text-white rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{lead.actionRequired}</span>
        </div>
      )}
    </Card>
  );
}

function LeadDetailPanel({ lead }: { lead: HotLead }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-lead-hot p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={`https://ui-avatars.com/api/?name=${lead.name}&background=fff&color=F97316`}
              className="w-16 h-16 rounded-full border-3 border-white"
              alt={lead.name}
            />
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              <p className="text-primary-foreground/80">
                {lead.phone} • {lead.city}
              </p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30">
              <PhoneCall className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30">
              <Send className="w-4 h-4" />
            </Button>
            <Button size="sm" className="bg-white text-primary hover:shadow-lg">
              Assumir Lead
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <MetricCard
            icon={<Flame />}
            label="Score"
            value={`${lead.score}°`}
            trend="+12"
          />
          <MetricCard
            icon={<DollarSign />}
            label="Potencial"
            value={`R$ ${lead.estimatedValue}`}
          />
          <MetricCard
            icon={<Clock />}
            label="Tempo"
            value={lead.daysInPipeline}
            subtext="dias"
          />
          <MetricCard
            icon={<Target />}
            label="Probabilidade"
            value="85%"
            trend="+5%"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border px-6">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="conversation">Conversa</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Anotações</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="overview">
            <OverviewTab lead={lead} />
          </TabsContent>
          <TabsContent value="conversation">
            <ConversationTab lead={lead} />
          </TabsContent>
          <TabsContent value="timeline">
            <div>Timeline em desenvolvimento...</div>
          </TabsContent>
          <TabsContent value="notes">
            <div>Anotações em desenvolvimento...</div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

function OverviewTab({ lead }: { lead: HotLead }) {
  return (
    <div className="space-y-6">
      {/* Informações Coletadas */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Informações do Projeto</h3>
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Produto de Interesse" value={lead.product} icon={lead.productIcon} />
          <InfoField label="Consumo/Tamanho" value={lead.consumption || 'Não informado'} />
          <InfoField label="Orçamento" value={lead.budget || `R$ ${lead.estimatedValue}`} />
          <InfoField label="Prazo" value={lead.timeline || 'Não informado'} />
          <InfoField label="Decisor" value={lead.decisionMaker ? 'Sim' : 'Não'} />
          <InfoField label="Concorrentes" value={lead.competitors || 'Não mencionou'} />
        </div>
      </div>

      {/* Próximos Passos Sugeridos */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Próximos Passos Recomendados</h3>
        <div className="space-y-2">
          <NextStep
            icon={<PhoneCall />}
            title="Ligar para confirmar interesse"
            description="Lead não responde há 2 horas, tentativa por telefone recomendada"
            priority="high"
          />
          <NextStep
            icon={<Send />}
            title="Enviar proposta personalizada"
            description="Todas informações coletadas, proposta pode ser gerada"
            priority="medium"
          />
          <NextStep
            icon={<Calendar />}
            title="Agendar visita técnica"
            description="Para projeto Steel Frame, visita aumenta conversão em 70%"
            priority="low"
          />
        </div>
      </div>

      {/* AI Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Insight da IA</h4>
              <p className="text-sm text-blue-700">
                Cliente mencionou "urgência" 3 vezes e comparou com concorrente. 
                Probabilidade de fechamento aumenta 40% se contato em 1 hora. 
                Sugestão: Oferecer desconto por decisão hoje.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConversationTab({ lead }: { lead: HotLead }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Últimas Mensagens</h3>
        <Button variant="link" size="sm" className="text-primary">
          Ver conversa completa →
        </Button>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {lead.recentMessages?.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg ${
              msg.sender === 'customer' 
                ? 'bg-muted text-foreground' 
                : 'bg-primary text-primary-foreground'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs opacity-70 mt-1">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reply */}
      <div className="border-t border-border pt-4">
        <Textarea
          placeholder="Digite uma mensagem..."
          className="resize-none"
          rows={3}
        />
        <div className="flex justify-between mt-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Template 1</Button>
            <Button variant="outline" size="sm">Template 2</Button>
          </div>
          <Button>Enviar</Button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function QuickStat({ label, value, icon, color, urgent }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${color} ${urgent && 'animate-pulse'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, subtext }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-white/60">{icon}</div>
        {trend && (
          <span className="text-xs text-green-300">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
        {subtext && <span className="text-sm font-normal ml-1">{subtext}</span>}
      </p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}

function InfoField({ label, value, icon }: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">
        {icon && <span className="mr-2">{icon}</span>}
        {value}
      </p>
    </div>
  );
}

function NextStep({ icon, title, description, priority }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}) {
  const priorityStyles = {
    high: 'border-lead-hot/20 bg-lead-hot/5',
    medium: 'border-primary/20 bg-primary/5',
    low: 'border-green-200 bg-green-50',
  };

  return (
    <div className={`p-3 rounded-lg border ${priorityStyles[priority]}`}>
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground mt-0.5">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Button variant="link" size="sm" className="text-primary">
          Executar
        </Button>
      </div>
    </div>
  );
}