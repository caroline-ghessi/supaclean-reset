import { useState, useEffect, useRef } from 'react';
import { Phone, Video, MoreVertical, Clock, CheckCheck } from 'lucide-react';
import { VendorMessageList } from './VendorMessageList';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VendorChatAreaProps {
  conversation: any;
  vendor: any;
}

export function VendorChatArea({ conversation, vendor }: VendorChatAreaProps) {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  const formatLastSeen = (lastMessageAt: string) => {
    const date = new Date(lastMessageAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header da conversa */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.customer_profile_pic} />
              <AvatarFallback>
                {conversation.customer_name?.[0]?.toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold">
                {conversation.customer_name || 'Cliente'}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{conversation.customer_phone}</span>
                <span>•</span>
                <span>última vez {formatLastSeen(conversation.last_message_at)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={conversation.conversation_status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {conversation.conversation_status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
            
            {isRealTimeEnabled && (
              <Badge variant="outline" className="text-xs text-green-600">
                🟢 Tempo Real
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}>
                  {isRealTimeEnabled ? 'Desativar' : 'Ativar'} Tempo Real
                </DropdownMenuItem>
                <DropdownMenuItem>Ver Perfil do Cliente</DropdownMenuItem>
                <DropdownMenuItem>Analisar Qualidade</DropdownMenuItem>
                <DropdownMenuItem>Exportar Conversa</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Estatísticas rápidas */}
        <div className="mt-3 flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <span>📩</span>
            <span>{conversation.total_messages} mensagens</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>👤</span>
            <span>{conversation.vendor_messages} do vendedor</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>💬</span>
            <span>{conversation.customer_messages} do cliente</span>
          </div>
          {conversation.last_response_time && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Resposta média: {conversation.last_response_time}min</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de mensagens */}
      <div className="flex-1 overflow-hidden">
        <VendorMessageList 
          conversationId={conversation.id}
          vendorId={vendor.id}
          realTimeEnabled={isRealTimeEnabled}
        />
      </div>
      
      {/* Nota sobre monitoramento */}
      <div className="p-3 bg-muted/20 border-t">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <span>🔍 Monitoramento de qualidade ativo - {vendor.name}</span>
        </div>
      </div>
    </div>
  );
}