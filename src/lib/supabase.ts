import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = 'https://groqsnnytvjabgeaekkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb3Fzbm55dHZqYWJnZWFla2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTU3ODcsImV4cCI6MjA2ODE3MTc4N30.HWBJVbSSShx1P8bqa4dvO9jCsCDybt2rhgPPBy8zEVs';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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