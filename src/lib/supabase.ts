// Usar o cliente principal do Supabase para evitar múltiplas instâncias
import { supabase } from '@/integrations/supabase/client';

// Re-export o cliente para manter compatibilidade
export { supabase };

// Helper para logs estruturados
export async function logSystem(
  level: 'info' | 'warning' | 'error' | 'debug',
  source: string,
  message: string,
  data?: any
) {
  try {
    const { error } = await supabase.from('system_logs').insert({
      level,
      source,
      message,
      data: data || null,
    });
    
    if (error) {
      console.error('Failed to log to database:', error);
    }
    
    // Também fazer log no console para desenvolvimento
    console.log(`[${level.toUpperCase()}] ${source}: ${message}`, data);
  } catch (error) {
    console.error('Failed to log:', error);
  }
}

// Helper para formatar datas do Supabase
export function parseSupabaseDate(dateStr: string): Date {
  return new Date(dateStr);
}

// Helper para formatar datas para o Supabase
export function formatSupabaseDate(date: Date): string {
  return date.toISOString();
}

// Helper para verificar se user está autenticado
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

// Helper para subscription cleanup
export function cleanupSubscription(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}