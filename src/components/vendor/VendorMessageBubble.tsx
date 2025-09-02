import { Check, CheckCheck, Clock, Download, Play, Volume2, Video, Image, FileText, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { formatFileSize } from '@/lib/utils';

interface VendorMessageBubbleProps {
  message: any;
}

export function VendorMessageBubble({ message }: VendorMessageBubbleProps) {
  const isFromVendor = message.from_me;
  const [imageError, setImageError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  
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

  const getFileIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return <Image size={16} />;
      case 'audio':
      case 'voice':
        return <Volume2 size={16} />;
      case 'video':
        return <Video size={16} />;
      case 'document':
        return <FileText size={16} />;
      default:
        return <File size={16} />;
    }
  };

  const getFileName = (mediaUrl: string, messageType: string) => {
    if (!mediaUrl) return 'arquivo';
    const urlParts = mediaUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    if (filename.includes('.')) return filename;
    
    const extensions: Record<string, string> = {
      'image': 'jpg',
      'audio': 'mp3',
      'voice': 'mp3',
      'video': 'mp4',
      'document': 'pdf'
    };
    
    return `arquivo.${extensions[messageType] || 'bin'}`;
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
            {message.media_url && !imageError ? (
              <>
                <img 
                  src={message.media_url} 
                  alt="Imagem"
                  className="max-w-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onClick={() => setShowLightbox(true)}
                  onError={() => setImageError(true)}
                />
                {showLightbox && (
                  <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowLightbox(false)}
                  >
                    <img 
                      src={message.media_url} 
                      alt="Imagem ampliada" 
                      className="max-w-full max-h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted/20 rounded border-dashed border">
                <Image size={20} className="text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Imagem</p>
                  <p className="text-xs text-muted-foreground">
                    {imageError ? 'Não foi possível carregar' : 'Carregando...'}
                  </p>
                </div>
                {message.media_url && (
                  <a 
                    href={message.media_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-auto"
                  >
                    <Download size={16} className="text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            )}
            {message.content !== '[Imagem]' && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        );
        
      case 'audio':
      case 'voice':
        return (
          <div className="space-y-2">
            {message.media_url ? (
              <div className="flex items-center gap-3 p-3 bg-muted/10 rounded">
                <Volume2 size={20} className="text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <audio 
                    controls 
                    className="w-full h-8"
                    preload="metadata"
                  >
                    <source src={message.media_url} type="audio/mpeg" />
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Áudio</span>
                {message.media_metadata?.seconds && (
                  <span className="text-xs text-muted-foreground">
                    {message.media_metadata.seconds}s
                  </span>
                )}
              </div>
            )}
            {message.content !== '[Áudio]' && message.content !== '[Voice]' && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-2">
            {message.media_url ? (
              <video 
                controls 
                className="max-w-full h-auto rounded max-h-60"
                preload="metadata"
              >
                <source src={message.media_url} type="video/mp4" />
                Seu navegador não suporta o elemento de vídeo.
              </video>
            ) : (
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span className="text-sm">Vídeo</span>
                {message.media_metadata?.seconds && (
                  <span className="text-xs text-muted-foreground">
                    {message.media_metadata.seconds}s
                  </span>
                )}
              </div>
            )}
            {message.content !== '[Vídeo]' && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        );
        
      case 'document':
        return (
          <div className="space-y-2">
            {message.media_url ? (
              <div className="flex items-center gap-3 p-3 bg-muted/10 rounded border">
                {getFileIcon(message.message_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getFileName(message.media_url, message.message_type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {message.media_metadata?.file_size && formatFileSize(message.media_metadata.file_size)}
                  </p>
                </div>
                <a 
                  href={message.media_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Download size={14} />
                  Baixar
                </a>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {message.media_metadata?.filename || 'Documento'}
                  </div>
                  {message.media_metadata?.file_size && (
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(message.media_metadata.file_size)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {message.content !== '[Documento]' && (
              <div className="text-sm">{message.content}</div>
            )}
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