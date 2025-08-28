import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Message } from '@/types/conversation.types';
import { Check, CheckCheck, Bot, User, UserCheck, Settings, FileText } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.sender_type === 'customer';
  const isBot = message.sender_type === 'bot';
  const isAgent = message.sender_type === 'agent';
  const isSystem = message.sender_type === 'system';

  const getSenderIcon = () => {
    switch (message.sender_type) {
      case 'customer':
        return <User className="h-3 w-3" />;
      case 'bot':
        return <Bot className="h-3 w-3" />;
      case 'agent':
        return <UserCheck className="h-3 w-3" />;
      case 'system':
        return <Settings className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getSenderName = () => {
    if (message.sender_name) return message.sender_name;
    
    switch (message.sender_type) {
      case 'customer':
        return 'Cliente';
      case 'bot':
        return 'Bot Drystore';
      case 'agent':
        return 'Agente';
      case 'system':
        return 'Sistema';
      default:
        return 'Desconhecido';
    }
  };

  const getMessageStatus = () => {
    if (isCustomer) return null;

    if (message.read_at) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    
    if (message.delivered_at) {
      return <CheckCheck className="h-3 w-3" />;
    }

    return <Check className="h-3 w-3" />;
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        isCustomer ? "justify-start" : "justify-end"
      )}
    >
      {isCustomer && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          {getSenderIcon()}
        </div>
      )}

      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3 shadow-sm",
          isCustomer && "bg-card text-card-foreground border border-border",
          isBot && "bg-primary text-primary-foreground",
          isAgent && "bg-blue-500 text-white",
          isSystem && "bg-muted text-muted-foreground border border-border"
        )}
      >
        {/* Sender info for non-customer messages */}
        {!isCustomer && (
          <div className="flex items-center gap-1 mb-1 text-xs opacity-90">
            {getSenderIcon()}
            <span>{getSenderName()}</span>
          </div>
        )}

        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Media if present */}
        {message.media_url && (
          <div className="mt-2">
            {message.media_type?.startsWith('image/') ? (
              <img 
                src={message.media_url} 
                alt="Mídia compartilhada" 
                className="max-w-full h-auto rounded max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
              />
            ) : message.media_type?.startsWith('audio/') ? (
              <audio controls className="w-full max-w-xs">
                <source src={message.media_url} type={message.media_type} />
                Seu navegador não suporta áudio.
              </audio>
            ) : message.media_type?.startsWith('video/') ? (
              <video controls className="max-w-full h-auto rounded max-h-60">
                <source src={message.media_url} type={message.media_type} />
                Seu navegador não suporta vídeo.
              </video>
            ) : (
              <a 
                href={message.media_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm p-2 bg-muted/20 rounded border"
              >
                <FileText className="h-4 w-4" />
                📎 {message.media_type || 'Arquivo anexo'}
              </a>
            )}
          </div>
        )}

        {/* Message timestamp and status */}
        <div className={cn(
          "flex items-center justify-between mt-2 text-xs",
          isCustomer ? "text-muted-foreground" : "text-current opacity-75"
        )}>
          <span>
            {format(message.created_at, 'HH:mm', { locale: ptBR })}
          </span>
          
          <div className="flex items-center gap-1">
            {getMessageStatus()}
          </div>
        </div>
      </div>

      {!isCustomer && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {getSenderIcon()}
        </div>
      )}
    </div>
  );
}