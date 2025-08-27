// Constantes do sistema Drystore

// Cores da marca Drystore
export const DRYSTORE_COLORS = {
  orange: '#F97316',
  darkGray: '#3A3A3A', 
  mediumGray: '#8A8A8A',
  white: '#FFFFFF',
} as const;

// Status de conversa com labels em português
export const CONVERSATION_STATUS_LABELS = {
  waiting: 'Aguardando',
  active: 'Ativa',
  in_bot: 'Com Bot',
  with_agent: 'Com Atendente',
  qualified: 'Qualificada',
  transferred: 'Transferida',
  closed: 'Fechada',
} as const;

// Temperatura de lead com labels
export const LEAD_TEMPERATURE_LABELS = {
  cold: 'Frio',
  warm: 'Morno', 
  hot: 'Quente',
} as const;

// Categorias de produto com labels
export const PRODUCT_CATEGORY_LABELS = {
  telha_shingle: 'Telha Shingle',
  energia_solar: 'Energia Solar',
  steel_frame: 'Steel Frame',
  drywall_divisorias: 'Drywall e Divisórias',
  ferramentas: 'Ferramentas',
  pisos: 'Pisos',
  acabamentos: 'Acabamentos',
  forros: 'Forros',
  saudacao: 'Saudação',
  institucional: 'Institucional',
  indefinido: 'Indefinido',
} as const;

// Tipos de remetente
export const SENDER_TYPE_LABELS = {
  customer: 'Cliente',
  bot: 'Bot',
  agent: 'Atendente',
  system: 'Sistema',
} as const;

// Estados brasileiros
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;

// Configurações de paginação
export const PAGINATION = {
  conversations: 20,
  messages: 50,
  logs: 100,
} as const;

// Configurações de tempo (em ms)
export const TIMEOUTS = {
  bot_response: 3000,
  message_send: 5000,
  typing_indicator: 1000,
} as const;

// Limites do sistema
export const LIMITS = {
  message_length: 4096,
  media_size_mb: 16,
  search_results: 100,
} as const;

// URLs e endpoints
export const ENDPOINTS = {
  whatsapp_webhook: '/api/whatsapp/webhook',
  whatsapp_send: '/api/whatsapp/send',
  bot_classify: '/api/bot/classify',
  bot_extract: '/api/bot/extract',
} as const;

// Configurações de realtime
export const REALTIME_CHANNELS = {
  conversations: 'conversations-changes',
  messages: 'messages-changes',
  system: 'system-events',
} as const;

// Níveis de log
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info', 
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Emojis para diferentes status e categorias
export const STATUS_EMOJIS = {
  waiting: '⏳',
  active: '🟢',
  in_bot: '🤖',
  with_agent: '👤',
  qualified: '⭐',
  transferred: '📲',
  closed: '✅',
} as const;

export const PRODUCT_EMOJIS = {
  telha_shingle: '🏠',
  energia_solar: '☀️',
  steel_frame: '🏗️',
  drywall_divisorias: '🧱',
  ferramentas: '🔧',
  pisos: '🔲',
  acabamentos: '🎨',
  forros: '📐',
  saudacao: '👋',
  institucional: 'ℹ️',
  indefinido: '❓',
} as const;

export const TEMPERATURE_EMOJIS = {
  cold: '🧊',
  warm: '🌡️',
  hot: '🔥',
} as const;