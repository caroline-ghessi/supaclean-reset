import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface HotLead {
  id: string;
  name: string;
  phone: string;
  city: string;
  score: number;
  urgency: 'critical' | 'high' | 'medium';
  product: string;
  productIcon: string;
  estimatedValue: string;
  messages: number;
  responseTime: string;
  lastContact: Date;
  lastMessage: string;
  actionRequired?: string;
  consumption?: string;
  budget?: string;
  timeline?: string;
  decisionMaker?: boolean;
  daysInPipeline: string;
  competitors?: string;
  recentMessages: Array<{
    sender: 'customer' | 'bot' | 'agent';
    text: string;
    time: string;
  }>;
}

interface UseHotLeadsParams {
  urgencyFilter?: string;
  productFilter?: string;
  sortBy?: 'score' | 'time' | 'value' | 'activity';
}

const PRODUCT_EMOJIS: Record<string, string> = {
  energia_solar: '☀️',
  telha_shingle: '🏠',
  steel_frame: '🏗️',
  drywall_divisorias: '🧱',
  pisos: '🔲',
  acabamentos: '🎨',
  forros: '📐',
  ferramentas: '🔧',
  indefinido: '❓',
  saudacao: '👋',
  institucional: 'ℹ️',
};

const PRODUCT_LABELS: Record<string, string> = {
  energia_solar: 'Energia Solar',
  telha_shingle: 'Telha Shingle',
  steel_frame: 'Steel Frame',
  drywall_divisorias: 'Drywall',
  pisos: 'Pisos',
  acabamentos: 'Acabamentos',
  forros: 'Forros',
  ferramentas: 'Ferramentas',
  indefinido: 'Indefinido',
  saudacao: 'Saudação',
  institucional: 'Institucional',
};

function calculateUrgency(lastMessageAt: Date, score: number): 'critical' | 'high' | 'medium' {
  const hoursAgo = (Date.now() - lastMessageAt.getTime()) / (1000 * 60 * 60);
  
  if (score >= 85 && hoursAgo >= 2) return 'critical';
  if (score >= 75 && hoursAgo >= 4) return 'high';
  if (score >= 70 || hoursAgo >= 8) return 'medium';
  
  return 'medium';
}

function estimateValue(productGroup: string, context: any): string {
  const defaults: Record<string, string> = {
    energia_solar: '35-50k',
    telha_shingle: '20-35k',
    steel_frame: '80-150k',
    drywall_divisorias: '8-20k',
    pisos: '15-30k',
    acabamentos: '10-25k',
    forros: '5-15k',
    ferramentas: '2-8k',
    saudacao: '5-15k',
    institucional: '5-15k',
    indefinido: '5-15k',
  };
  
  return defaults[productGroup] || '5-15k';
}

export function useHotLeads(params: UseHotLeadsParams = {}) {
  return useQuery({
    queryKey: ['hot-leads', params],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          messages(
            id,
            content,
            created_at,
            sender_type,
            sender_name
          ),
          project_contexts(*),
          lead_distributions(id, sent_at)
        `)
        .or('lead_temperature.eq.hot,lead_score.gte.70')
        .neq('source', 'test')
        .is('lead_distributions.id', null)
        .order('lead_score', { ascending: false })
        .order('last_message_at', { ascending: false });

      // Apply filters
      if (params.productFilter && params.productFilter !== 'all') {
        query = query.eq('product_group', params.productFilter as any);
      }

      const { data: conversations, error } = await query;

      if (error) throw error;

      // Process and transform data
      const hotLeads: HotLead[] = conversations?.map(conv => {
        // Sort messages by date to get the most recent first
        const sortedMessages = conv.messages?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || [];
        
        const lastMessage = sortedMessages[0];
        const messageCount = sortedMessages.length;
        const lastMessageAt = new Date(conv.last_message_at || conv.created_at);
        const score = conv.lead_score || 70;
        const urgency = calculateUrgency(lastMessageAt, score);
        
        // Get recent messages for conversation preview
        const recentMessages = sortedMessages
          .slice(0, 5)
          .map(msg => ({
            sender: (msg.sender_type === 'customer' ? 'customer' : 
                    msg.sender_type === 'agent' ? 'agent' : 'bot') as 'customer' | 'bot' | 'agent',
            text: msg.content.substring(0, 100),
            time: new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
          }));

        const productGroup = conv.product_group || 'indefinido';
        const estimatedValue = estimateValue(productGroup, conv.project_contexts?.[0]);
        
        // Calculate action required based on urgency and time
        let actionRequired: string | undefined;
        const hoursAgo = (Date.now() - lastMessageAt.getTime()) / (1000 * 60 * 60);
        
        if (urgency === 'critical') {
          actionRequired = `Cliente aguardando resposta há ${Math.floor(hoursAgo)}h`;
        } else if (score >= 85 && hoursAgo >= 1) {
          actionRequired = 'Lead quente precisa de atenção';
        }

        return {
          id: conv.id,
          name: conv.customer_name || conv.whatsapp_name || `Cliente ${conv.whatsapp_number}`,
          phone: conv.whatsapp_number,
          city: conv.customer_city || 'Não informado',
          score,
          urgency,
          product: PRODUCT_LABELS[productGroup] || 'Indefinido',
          productIcon: PRODUCT_EMOJIS[productGroup] || '❓',
          estimatedValue,
          messages: messageCount,
          responseTime: hoursAgo < 1 ? 'Responde rápido' : hoursAgo < 4 ? 'Demora um pouco' : hoursAgo > 24 ? 'Há mais de 1 dia' : 'Resposta lenta',
          lastContact: lastMessageAt,
          lastMessage: lastMessage?.content?.substring(0, 80) || 'Sem mensagens',
          actionRequired,
          consumption: conv.project_contexts?.[0]?.energy_consumption || undefined,
          budget: conv.project_contexts?.[0]?.budget_range || undefined,
          timeline: conv.project_contexts?.[0]?.timeline || undefined,
          decisionMaker: true, // Could be derived from context
          daysInPipeline: Math.floor((Date.now() - new Date(conv.created_at).getTime()) / (1000 * 60 * 60 * 24)).toString(),
          competitors: undefined, // Could be extracted from messages
          recentMessages,
        };
      }) || [];

      // Apply sorting
      if (params.sortBy === 'time') {
        hotLeads.sort((a, b) => a.lastContact.getTime() - b.lastContact.getTime());
      } else if (params.sortBy === 'value') {
        hotLeads.sort((a, b) => {
          const aValue = parseInt(a.estimatedValue.split('-')[1].replace('k', ''));
          const bValue = parseInt(b.estimatedValue.split('-')[1].replace('k', ''));
          return bValue - aValue;
        });
      } else if (params.sortBy === 'activity') {
        hotLeads.sort((a, b) => b.lastContact.getTime() - a.lastContact.getTime());
      }
      // Default sort by score is already applied in the query

      // Apply urgency filter
      if (params.urgencyFilter && params.urgencyFilter !== 'all') {
        return hotLeads.filter(lead => lead.urgency === params.urgencyFilter);
      }

      return hotLeads;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useHotLeadsStats() {
  return useQuery({
    queryKey: ['hot-leads-stats'],
    queryFn: async () => {
      // Get current timestamp for comparisons
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      // Get leads waiting for response (>2h) that haven't been distributed
      const { data: waitingLeads } = await supabase
        .from('conversations')
        .select('id, last_message_at, lead_score, lead_distributions(id)')
        .or('lead_temperature.eq.hot,lead_score.gte.70')
        .neq('source', 'test')
        .is('lead_distributions.id', null)
        .lt('last_message_at', twoHoursAgo);

      // Get all hot leads for value calculation
      const { data: allHotLeads } = await supabase
        .from('conversations')
        .select('id, product_group, project_contexts(*)')
        .or('lead_temperature.eq.hot,lead_score.gte.70')
        .neq('source', 'test');

      // Calculate total estimated value
      const totalValue = allHotLeads?.reduce((sum, conv) => {
        const estimate = estimateValue(conv.product_group || 'indefinido', conv.project_contexts?.[0]);
        const maxValue = parseInt(estimate.split('-')[1]?.replace('k', '') || '15');
        return sum + maxValue;
      }, 0) || 0;

      // Get today's lead distributions (converted leads)
      const { data: todayDistributions } = await supabase
        .from('lead_distributions')
        .select('id')
        .gte('sent_at', today + 'T00:00:00Z')
        .lte('sent_at', today + 'T23:59:59Z');

      // Get today's hot leads created
      const { data: todayHotLeads } = await supabase
        .from('conversations')
        .select('id')
        .or('lead_temperature.eq.hot,lead_score.gte.70')
        .neq('source', 'test')
        .gte('created_at', today + 'T00:00:00Z')
        .lte('created_at', today + 'T23:59:59Z');

      // Calculate conversion rate
      const conversions = todayDistributions?.length || 0;
      const totalTodayHot = todayHotLeads?.length || 0;
      const conversionRate = totalTodayHot > 0 ? Math.round((conversions / totalTodayHot) * 100) : 0;

      return {
        waitingCount: waitingLeads?.length || 0,
        totalValue: totalValue * 1000, // Convert to actual value
        conversionRate,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}