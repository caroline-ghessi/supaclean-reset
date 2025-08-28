import { useEffect, useRef } from 'react';
import { useVendorMessages } from '@/hooks/useVendorMessages';
import { VendorMessageBubble } from './VendorMessageBubble';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorMessageListProps {
  conversationId: number;
  vendorId: string;
  realTimeEnabled: boolean;
}

export function VendorMessageList({ conversationId, vendorId, realTimeEnabled }: VendorMessageListProps) {
  const { data: messages, isLoading } = useVendorMessages(conversationId, realTimeEnabled);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <Skeleton className="h-16 w-64 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Nenhuma mensagem ainda</p>
          <p className="text-sm">As mensagens aparecerão aqui em tempo real</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
      {messages.map((message) => (
        <VendorMessageBubble key={message.id} message={message} />
      ))}
      <div ref={scrollRef} />
    </div>
  );
}