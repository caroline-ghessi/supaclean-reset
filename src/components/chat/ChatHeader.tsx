import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/types/conversation.types';
import { Phone, MoreVertical, UserCheck, Bot, Clock, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatHeaderProps {
  conversation: Conversation | null | undefined;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  if (!conversation) {
    return (
      <div className="p-4 border-b border-border bg-card">
        <div className="text-center text-muted-foreground">
          Selecione uma conversa
        </div>
      </div>
    );
  }

  const temperatureColors = {
    cold: 'bg-blue-500',
    warm: 'bg-orange-500',
    hot: 'bg-red-500',
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

  const getStatusIcon = () => {
    switch (conversation.status) {
      case 'in_bot':
        return <Bot className="h-4 w-4" />;
      case 'with_agent':
        return <UserCheck className="h-4 w-4" />;
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 border-b border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {conversation.customer_name?.[0] || conversation.whatsapp_number[0]}
            </span>
          </div>

          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {conversation.customer_name || 'Cliente'}
              </h3>
              <Badge className={`text-white text-xs ${temperatureColors[conversation.lead_temperature]}`}>
                <Star className="h-3 w-3 mr-1" />
                {conversation.lead_score}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{conversation.whatsapp_number}</span>
              {conversation.customer_city && (
                <>
                  <span>•</span>
                  <span>{conversation.customer_city}, {conversation.customer_state}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status and metadata */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge 
          variant="outline" 
          className={`text-white ${statusColors[conversation.status]}`}
        >
          {getStatusIcon()}
          <span className="ml-1 capitalize">{conversation.status.replace('_', ' ')}</span>
        </Badge>
        
        <Badge variant="outline">
          {getProductGroupLabel(conversation.product_group)}
        </Badge>

        {conversation.assigned_agent_id && (
          <Badge variant="outline">
            <UserCheck className="h-3 w-3 mr-1" />
            Agente atribuído
          </Badge>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          Última atividade: {formatDistanceToNow(conversation.last_message_at, { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </span>
      </div>
    </div>
  );
}