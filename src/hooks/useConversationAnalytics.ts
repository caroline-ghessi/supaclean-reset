import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ConversationAnalytics {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  avgMessagesPerConversation: number;
  conversionRate: number;
  dailyConversations: { date: string; count: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  categoryDistribution: { category: string; count: number; percentage: number }[];
  responseTimeData: { period: string; avgMinutes: number }[];
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

export function useConversationAnalytics(period: string = '7d') {
  return useQuery({
    queryKey: ['conversation-analytics', period],
    queryFn: async (): Promise<ConversationAnalytics> => {
      const { startDate, endDate } = getPeriodDates(period);
      
      // Buscar conversas do período
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          status,
          product_group,
          created_at,
          updated_at,
          lead_temperature,
          messages(count)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversationsError) throw conversationsError;

      // Buscar analytics agregados existentes
      const { data: analytics, error: analyticsError } = await supabase
        .from('conversation_analytics')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (analyticsError) throw analyticsError;

      const totalConversations = conversations?.length || 0;
      const activeConversations = conversations?.filter(c => c.status === 'active').length || 0;
      const completedConversations = conversations?.filter(c => c.status === 'closed').length || 0;
      
      // Calcular conversas por dia
      const dailyConversations = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayConversations = conversations?.filter(c => 
          format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr
        ).length || 0;
        
        dailyConversations.push({
          date: format(d, 'dd/MM'),
          count: dayConversations
        });
      }

      // Distribuição por status
      const statusCounts = conversations?.reduce((acc, conv) => {
        acc[conv.status] = (acc[conv.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / totalConversations) * 100)
      }));

      // Distribuição por categoria
      const categoryCounts = conversations?.reduce((acc, conv) => {
        const category = conv.product_group || 'indefinido';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalConversations) * 100)
      }));

      // Calcular métricas
      const totalMessages = conversations?.reduce((acc, conv) => 
        acc + (conv.messages?.[0]?.count || 0), 0) || 0;
      
      const avgMessagesPerConversation = totalConversations > 0 
        ? Math.round(totalMessages / totalConversations) 
        : 0;

      const hotLeads = conversations?.filter(c => c.lead_temperature === 'hot').length || 0;
      const conversionRate = totalConversations > 0 
        ? Math.round((hotLeads / totalConversations) * 100 * 10) / 10 
        : 0;

      // Dados de tempo de resposta (mockado por enquanto)
      const responseTimeData = dailyConversations.map(day => ({
        period: day.date,
        avgMinutes: Math.random() * 5 + 1 // Simular entre 1-6 minutos
      }));

      return {
        totalConversations,
        activeConversations,
        completedConversations,
        avgMessagesPerConversation,
        conversionRate,
        dailyConversations,
        statusDistribution,
        categoryDistribution,
        responseTimeData
      };
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
}