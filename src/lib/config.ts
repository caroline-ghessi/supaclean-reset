// Configuration for the WhatsApp Business API integration
export const config = {
  supabase: {
    url: 'https://groqsnnytvjabgeaekkw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb3Fzbm55dHZqYWJnZWFla2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTU3ODcsImV4cCI6MjA2ODE3MTc4N30.HWBJVbSSShx1P8bqa4dvO9jCsCDybt2rhgPPBy8zEVs',
  },
  whatsapp: {
    // These are configured as Supabase secrets and accessed via edge functions
    webhookVerifyToken: 'DRYSTORE_WEBHOOK_2024',
    businessAccountId: import.meta.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  },
  app: {
    url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
    env: import.meta.env.MODE || 'development',
  }
} as const;

// Helper to get webhook URL for WhatsApp configuration
export function getWebhookUrl(): string {
  const supabaseProjectId = 'groqsnnytvjabgeaekkw';
  return `https://${supabaseProjectId}.functions.supabase.co/whatsapp-webhook`;
}

// Helper to validate WhatsApp phone number format
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Brazil country code if missing
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}