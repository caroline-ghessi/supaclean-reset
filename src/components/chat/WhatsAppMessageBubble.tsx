import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '@/types/conversation.types';

interface WhatsAppMessageBubbleProps {
  message: Message;
}

export function WhatsAppMessageBubble({ message }: WhatsAppMessageBubbleProps) {
  const isFromAgent = message.sender_type === 'agent';
  
  const getStatusIcon = () => {
    if (!isFromAgent) return null;
    
    if (message.read_at) {
      return <CheckCheck size={14} className="text-blue-500" />;
    } else if (message.delivered_at) {
      return <CheckCheck size={14} className="text-muted-foreground" />;
    } else {
      return <Check size={14} className="text-muted-foreground/50" />;
    }
  };

  return (
    <div className={`flex ${isFromAgent ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[65%] ${isFromAgent ? 'order-2' : 'order-1'}`}>
        <div 
          className={`
            relative px-3 py-2 rounded-lg shadow-sm
            ${isFromAgent 
              ? 'bg-chat-bubble-sent text-foreground rounded-br-sm' 
              : 'bg-chat-bubble-received text-foreground rounded-bl-sm border border-border/20'
            }
          `}
        >
          {/* Message Content */}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
          
          {/* Time and Status */}
          <div className="flex items-center justify-end gap-1 mt-1 -mb-1">
            <span className="text-[11px] text-muted-foreground/70">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}