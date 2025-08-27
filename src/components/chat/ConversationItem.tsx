import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConversationWithLastMessage } from '@/types/conversation.types';

interface ConversationItemProps {
  conversation: ConversationWithLastMessage;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const temperatureColors = {
    cold: 'bg-blue-500 hover:bg-blue-600',
    warm: 'bg-orange-500 hover:bg-orange-600',
    hot: 'bg-red-500 hover:bg-red-600',
  };

  const statusColors = {
    waiting: 'bg-yellow-500',
    active: 'bg-green-500',
    in_bot: 'bg-blue-500',
    with_agent: 'bg-purple-500',
    qualified: 'bg-emerald-500',
    transferred: 'bg-orange-500',
    closed: 'bg-gray-500',
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const getProductGroupLabel = (group: string) => {
    const labels = {
      telha_shingle: 'Telha Shingle',
      energia_solar: 'Energia Solar',
      steel_frame: 'Steel Frame',
      drywall_divisorias: 'Drywall',
      ferramentas: 'Ferramentas',
      pisos: 'Pisos',
      acabamentos: 'Acabamentos',
      forros: 'Forros',
      saudacao: 'Saudação',
      institucional: 'Institucional',
      indefinido: 'Indefinido',
    };
    return labels[group as keyof typeof labels] || group;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/10 border-l-4 border-l-primary"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {conversation.customer_name || conversation.whatsapp_number}
            </h3>
            <Badge className={`text-white text-xs ${temperatureColors[conversation.lead_temperature]}`}>
              {conversation.lead_score}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mb-2">
            {conversation.lastMessage?.content || "Nova conversa"}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {getProductGroupLabel(conversation.product_group)}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs text-white ${statusColors[conversation.status]}`}
            >
              {conversation.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(conversation.last_message_at)}
            </span>
          </div>
        </div>
        
        {conversation.unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground ml-2">
            {conversation.unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
}