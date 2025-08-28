import { Check, CheckCheck, Clock, Download, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VendorMessageBubbleProps {
  message: any;
}

export function VendorMessageBubble({ message }: VendorMessageBubbleProps) {
  const isFromVendor = message.from_me;
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-2">
            {message.media_url && (
              <img 
                src={message.media_url} 
                alt="Imagem"
                className="max-w-64 rounded-lg"
                loading="lazy"
              />
            )}
            {message.content !== '[Imagem]' && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        );
        
      case 'audio':
      case 'voice':
        return (
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Play className="h-4 w-4" />
            </Button>
            <span className="text-sm">Áudio</span>
            {message.media_metadata?.seconds && (
              <span className="text-xs text-muted-foreground">
                {message.media_metadata.seconds}s
              </span>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Play className="h-4 w-4" />
              </Button>
              <span className="text-sm">Vídeo</span>
              {message.media_metadata?.seconds && (
                <span className="text-xs text-muted-foreground">
                  {message.media_metadata.seconds}s
                </span>
              )}
            </div>
            {message.content !== '[Vídeo]' && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        );
        
      case 'document':
        return (
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Download className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {message.media_metadata?.filename || 'Documento'}
              </div>
              {message.media_metadata?.file_size && (
                <div className="text-xs text-muted-foreground">
                  {Math.round(message.media_metadata.file_size / 1024)} KB
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return <div className="text-sm italic">{message.content}</div>;
    }
  };

  return (
    <div className={`flex ${isFromVendor ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isFromVendor
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground'
      }`}>
        {/* Remetente */}
        {!isFromVendor && message.from_name && (
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            {message.from_name}
          </div>
        )}
        
        {/* Conteúdo */}
        <div className="mb-1">
          {renderMessageContent()}
        </div>
        
        {/* Metadados */}
        <div className={`flex items-center justify-between text-xs ${
          isFromVendor ? 'text-primary-foreground/70' : 'text-muted-foreground'
        }`}>
          <span>{formatTime(message.timestamp_whatsapp)}</span>
          
          <div className="flex items-center space-x-1 ml-2">
            {/* Tipo de mensagem */}
            {message.message_type !== 'text' && (
              <Badge variant="outline" className="text-xs py-0 px-1">
                {message.message_type}
              </Badge>
            )}
            
            {/* Status da mensagem (apenas para vendedor) */}
            {isFromVendor && message.status && (
              <div className="flex items-center">
                {getStatusIcon(message.status)}
              </div>
            )}
            
            {/* Indicador de encaminhada */}
            {message.is_forwarded && (
              <span className="text-xs">↪</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}