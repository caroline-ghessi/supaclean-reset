import { format } from 'date-fns';
import { Check, CheckCheck, Download, FileText, Image, Play, Volume2, Video, File } from 'lucide-react';
import { Message } from '@/types/conversation.types';
import { useState } from 'react';

interface WhatsAppMessageBubbleProps {
  message: Message;
}

export function WhatsAppMessageBubble({ message }: WhatsAppMessageBubbleProps) {
  const isFromAgent = message.sender_type === 'agent' || message.sender_type === 'bot';
  const [imageError, setImageError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={16} />;
    if (mimeType.startsWith('audio/')) return <Volume2 size={16} />;
    if (mimeType.startsWith('video/')) return <Video size={16} />;
    if (mimeType.includes('pdf')) return <FileText size={16} />;
    return <File size={16} />;
  };

  const getFileName = (mediaUrl: string, mimeType: string) => {
    if (!mediaUrl) return 'arquivo';
    const urlParts = mediaUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    return filename.includes('.') ? filename : `arquivo.${getExtension(mimeType)}`;
  };

  const getExtension = (mimeType: string) => {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'video/mp4': 'mp4',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };
    return extensions[mimeType] || 'bin';
  };

  const formatFileSize = (url: string) => {
    // Placeholder - em produção você pode armazenar o tamanho do arquivo
    return '';
  };

  const renderMediaContent = () => {
    if (!message.media_url || !message.media_type) return null;

    const mimeType = message.media_type;

    // Imagens
    if (mimeType.startsWith('image/')) {
      return (
        <div className="mt-2 relative">
          {!imageError ? (
            <>
              <img 
                src={message.media_url} 
                alt="Imagem compartilhada" 
                className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity max-h-60 object-cover"
                onClick={() => setShowLightbox(true)}
                onError={() => setImageError(true)}
                loading="lazy"
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
              <div>
                <p className="text-sm font-medium">Imagem</p>
                <p className="text-xs text-muted-foreground">Não foi possível carregar</p>
              </div>
              <a 
                href={message.media_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Download size={16} className="text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          )}
        </div>
      );
    }

    // Áudio
    if (mimeType.startsWith('audio/')) {
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-3 p-3 bg-muted/10 rounded">
            <Volume2 size={20} className="text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <audio 
                controls 
                className="w-full h-8"
                preload="metadata"
              >
                <source src={message.media_url} type={mimeType} />
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>
          </div>
          
          {/* Transcrição */}
          {message.transcription && (
            <div className="p-3 bg-muted/5 rounded border-l-2 border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Transcrição:</p>
              <p className="text-sm italic">{message.transcription}</p>
            </div>
          )}
          
          {/* Status de Transcrição */}
          {message.transcription_status === 'pending' && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
              🎵 Transcrevendo áudio...
            </div>
          )}
          
          {message.transcription_status === 'failed' && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
              ❌ Erro na transcrição
            </div>
          )}
        </div>
      );
    }

    // Vídeo
    if (mimeType.startsWith('video/')) {
      return (
        <div className="mt-2">
          <video 
            controls 
            className="max-w-full h-auto rounded max-h-60"
            preload="metadata"
          >
            <source src={message.media_url} type={mimeType} />
            Seu navegador não suporta o elemento de vídeo.
          </video>
        </div>
      );
    }

    // Documentos
    return (
      <div className="mt-2 flex items-center gap-3 p-3 bg-muted/10 rounded border">
        {getFileIcon(mimeType)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {getFileName(message.media_url, mimeType)}
          </p>
          <p className="text-xs text-muted-foreground">
            {mimeType} {formatFileSize(message.media_url)}
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
    );
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
          {message.content && !message.content.startsWith('[') && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
          
          {/* Media Content */}
          {renderMediaContent()}
          
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