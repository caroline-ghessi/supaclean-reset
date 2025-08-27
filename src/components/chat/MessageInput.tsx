import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  disabled = false,
  placeholder = "Digite sua mensagem..." 
}: MessageInputProps) {
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <Button variant="outline" size="icon" disabled={disabled}>
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-32 resize-none pr-10"
            rows={1}
          />
          
          {/* Emoji button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Send button */}
        <Button 
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            "transition-all duration-200",
            value.trim() ? "bg-primary hover:bg-primary/90" : ""
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Character counter or status */}
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <span>{disabled ? "Enviando..." : ""}</span>
        <span>{value.length}/1000</span>
      </div>
    </div>
  );
}