/**
 * Utilities para gerenciar tokens de vendedores via Supabase Secrets
 */

// Gerar nome do secret para um vendedor
export function getVendorTokenSecretName(vendorId: string): string {
  return `VENDOR_TOKEN_${vendorId}`;
}

// Validar formato do token (Whapi Cloud)
export function isValidWhapiToken(token: string): boolean {
  // Whapi tokens geralmente seguem um padrão específico
  return token && token.length > 10 && !token.includes(' ');
}

// Extrair vendor ID do nome do secret
export function extractVendorIdFromSecretName(secretName: string): string | null {
  const match = secretName.match(/^VENDOR_TOKEN_(.+)$/);
  return match ? match[1] : null;
}

// Tipo para status de configuração do token
export type TokenConfigStatus = 'configured' | 'pending' | 'error' | 'unknown';

export function getTokenStatusLabel(status: TokenConfigStatus): string {
  switch (status) {
    case 'configured':
      return 'Token Configurado';
    case 'pending':
      return 'Token Pendente';
    case 'error':
      return 'Erro na Configuração';
    default:
      return 'Status Desconhecido';
  }
}

export function getTokenStatusColor(status: TokenConfigStatus): string {
  switch (status) {
    case 'configured':
      return 'text-green-600';
    case 'pending':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}