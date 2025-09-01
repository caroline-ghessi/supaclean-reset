import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

interface LeadTemperatureData {
  temperature: 'hot' | 'warm' | 'cold';
  count: number;
  percentage: number;
  conversionRate: number;
}

interface ProductCategoryData {
  category: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  avgLeadScore: number;
}

interface LeadAnalyticsData {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  overallConversionRate: number;
  avgLeadScore: number;
  temperatureDistribution: LeadTemperatureData[];
  categoryPerformance: ProductCategoryData[];
  dailyLeads: { date: string; hot: number; warm: number; cold: number }[];
  leadSources: { source: string; count: number; percentage: number }[];
  conversionFunnel: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
}

const getPeriodDates = (period: string) => {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      break;
    case '7d':
      startDate = subDays(now, 7);
      break;
    case '30d':
      startDate = subDays(now, 30);
      break;
    case '90d':
      startDate = subDays(now, 90);
      break;
    default:
      startDate = subDays(now, 7);
  }
  
  return { startDate, endDate: endOfDay(now) };
};

export function useLeadAnalytics(period: string = '7d') {
  return useQuery({
    queryKey: ['lead-analytics', period],
    queryFn: async (): Promise<LeadAnalyticsData> => {
      const { startDate, endDate } = getPeriodDates(period);
      
      // Buscar conversas (que são nossos leads)
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          lead_temperature,
          lead_score,
          product_group,
          status,
          source,
          created_at,
          updated_at
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversationsError) throw conversationsError;

      // Buscar distribuições de leads
      const { data: leadDistributions, error: distributionsError } = await supabase
        .from('lead_distributions')
        .select('*')
        .gte('sent_at', startDate.toISOString())
        .lte('sent_at', endDate.toISOString());

      if (distributionsError) throw distributionsError;

      const totalLeads = conversations?.length || 0;
      const hotLeads = conversations?.filter(c => c.lead_temperature === 'hot').length || 0;
      const warmLeads = conversations?.filter(c => c.lead_temperature === 'warm').length || 0;
      const coldLeads = conversations?.filter(c => c.lead_temperature === 'cold').length || 0;
      
      const convertedLeads = leadDistributions?.length || 0; // Leads que foram enviados para vendedores
      const overallConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      const avgLeadScore = conversations?.length > 0
        ? conversations.reduce((sum, c) => sum + (c.lead_score || 0), 0) / conversations.length
        : 0;

      // Distribuição por temperatura
      const temperatureDistribution: LeadTemperatureData[] = [
        {
          temperature: 'hot',
          count: hotLeads,
          percentage: totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0,
          conversionRate: hotLeads > 0 ? 85 : 0 // Simulado
        },
        {
          temperature: 'warm',
          count: warmLeads,
          percentage: totalLeads > 0 ? Math.round((warmLeads / totalLeads) * 100) : 0,
          conversionRate: warmLeads > 0 ? 45 : 0 // Simulado
        },
        {
          temperature: 'cold',
          count: coldLeads,
          percentage: totalLeads > 0 ? Math.round((coldLeads / totalLeads) * 100) : 0,
          conversionRate: coldLeads > 0 ? 15 : 0 // Simulado
        }
      ];

      // Performance por categoria de produto
      const categories = [...new Set(conversations?.map(c => c.product_group || 'indefinido') || [])];
      const categoryPerformance: ProductCategoryData[] = categories.map(category => {
        const categoryLeads = conversations?.filter(c => 
          (c.product_group || 'indefinido') === category
        ) || [];
        
        const categoryConversions = leadDistributions?.filter(d => {
          const conversation = conversations?.find(c => c.id === d.conversation_id);
          return conversation && (conversation.product_group || 'indefinido') === category;
        }).length || 0;

        const conversionRate = categoryLeads.length > 0 
          ? (categoryConversions / categoryLeads.length) * 100 
          : 0;

        const avgLeadScore = categoryLeads.length > 0
          ? categoryLeads.reduce((sum, c) => sum + (c.lead_score || 0), 0) / categoryLeads.length
          : 0;

        return {
          category,
          leads: categoryLeads.length,
          conversions: categoryConversions,
          conversionRate: Math.round(conversionRate * 10) / 10,
          avgLeadScore: Math.round(avgLeadScore * 10) / 10
        };
      });

      // Leads diários
      const dailyLeads = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayConversations = conversations?.filter(c => 
          format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr
        ) || [];
        
        dailyLeads.push({
          date: format(d, 'dd/MM'),
          hot: dayConversations.filter(c => c.lead_temperature === 'hot').length,
          warm: dayConversations.filter(c => c.lead_temperature === 'warm').length,
          cold: dayConversations.filter(c => c.lead_temperature === 'cold').length
        });
      }

      // Fontes de leads
      const sources = conversations?.reduce((acc, conv) => {
        const source = conv.source || 'indefinido';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const leadSources = Object.entries(sources).map(([source, count]) => ({
        source,
        count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
      }));

      // Funil de conversão
      const conversionFunnel = [
        {
          stage: 'Leads Captados',
          count: totalLeads,
          conversionRate: 100
        },
        {
          stage: 'Leads Qualificados',
          count: hotLeads + warmLeads,
          conversionRate: totalLeads > 0 ? Math.round(((hotLeads + warmLeads) / totalLeads) * 100) : 0
        },
        {
          stage: 'Leads Enviados',
          count: convertedLeads,
          conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
        },
        {
          stage: 'Leads Convertidos',
          count: Math.floor(convertedLeads * 0.3), // Simulado - 30% dos enviados
          conversionRate: totalLeads > 0 ? Math.round((convertedLeads * 0.3 / totalLeads) * 100) : 0
        }
      ];

      return {
        totalLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        overallConversionRate: Math.round(overallConversionRate * 10) / 10,
        avgLeadScore: Math.round(avgLeadScore * 10) / 10,
        temperatureDistribution,
        categoryPerformance,
        dailyLeads,
        leadSources,
        conversionFunnel
      };
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
}