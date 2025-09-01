import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConversationWithLastMessage } from '@/types/conversation.types';

interface WhatsAppConversationItemProps {
  conversation: ConversationWithLastMessage;
  isSelected: boolean;
  onClick: () => void;
}

export function WhatsAppConversationItem({ conversation, isSelected, onClick }: WhatsAppConversationItemProps) {
  const getDisplayName = () => {
    return conversation.customer_name || conversation.whatsapp_name || 'Usuário';
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Ontem';
    } else {
      return format(messageDate, 'dd/MM/yyyy');
    }
  };

  const getProductIcon = (productGroup: string) => {
    const icons = {
      energia_solar: '☀️',
      telha_shingle: '🏠',
      steel_frame: '🏗️',
      drywall_divisorias: '🧱',
      ferramentas: '🔧',
      pisos: '🏁',
      acabamentos: '🎨',
      forros: '📐'
    };
    return icons[productGroup as keyof typeof icons] || '📦';
  };

  const getTemperatureIcon = (temperature: string) => {
    const icons = {
      hot: '🔥',
      warm: '🌡️',
      cold: '❄️'
    };
    return icons[temperature as keyof typeof icons] || '';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      qualified: 'bg-purple-100 text-purple-700',
      bot: 'bg-blue-100 text-blue-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div 
      onClick={onClick}
      className={`flex items-center px-4 py-3 hover:bg-chat-list-hover cursor-pointer transition-colors border-b border-border/50 ${
        isSelected ? 'bg-chat-list-active' : ''
      }`}
    >
      <Avatar className="w-12 h-12 mr-3">
        <AvatarImage 
          src={`https://ui-avatars.com/api/?name=${getDisplayName()}&background=F97316&color=fff`}
          alt={getDisplayName()}
        />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {getDisplayName().charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {getDisplayName()}
            </h4>
            {conversation.product_group && (
              <span className="text-sm" title={conversation.product_group}>
                {getProductIcon(conversation.product_group)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-muted-foreground">
              {conversation.last_message_at ? formatMessageTime(conversation.last_message_at.toString()) : ''}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            {conversation.lastMessage?.sender_type === 'agent' && (
              conversation.lastMessage?.read_at ? 
                <CheckCheck size={16} className="text-blue-500 mr-1 flex-shrink-0" /> :
                <Check size={16} className="text-muted-foreground mr-1 flex-shrink-0" />
            )}
            <p className="text-sm text-muted-foreground truncate">
              {conversation.lastMessage?.content || 'Nenhuma mensagem'}
            </p>
          </div>
          
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {conversation.unreadCount > 0 && (
              <Badge className="bg-green-500 text-white text-xs h-5 min-w-[20px] justify-center">
                {conversation.unreadCount}
              </Badge>
            )}
            
            {conversation.lead_temperature && (
              <span className="text-sm" title={`Lead ${conversation.lead_temperature}`}>
                {getTemperatureIcon(conversation.lead_temperature)}
              </span>
            )}
          </div>
        </div>

        {/* Status and Score Row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Badge 
              variant="outline" 
              className={`text-xs h-5 ${getStatusColor(conversation.status)}`}
            >
              {conversation.status === 'waiting' && 'Aguardando'}
              {conversation.status === 'active' && 'Ativo'}
              {conversation.status === 'qualified' && 'Qualificado'}
              {conversation.status === 'in_bot' && 'Bot'}
            </Badge>
            
            {(conversation as any).isDistributed && (
              <Badge 
                variant="outline" 
                className="text-xs h-5 bg-purple-100 text-purple-700 border-purple-200"
                title={`Enviado para ${(conversation as any).distributedTo || 'vendedor'}`}
              >
                📨 Enviado
              </Badge>
            )}
          </div>
          
          {conversation.lead_score !== null && (
            <Badge variant="secondary" className="text-xs h-5">
              {conversation.lead_score}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}