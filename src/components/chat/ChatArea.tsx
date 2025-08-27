import { useState } from 'react';
import { useConversation } from '@/hooks/useConversations';
import { useCreateMessage } from '@/hooks/useMessages';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatAreaProps {
  conversationId: string;
}

export function ChatArea({ conversationId }: ChatAreaProps) {
  const { data: conversation, isLoading } = useConversation(conversationId);
  const createMessage = useCreateMessage();
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      await createMessage.mutateAsync({
        conversation_id: conversationId,
        sender_type: 'agent',
        content: message,
        is_read: false,
        metadata: {},
      });
      
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <Skeleton className="h-16 w-64 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader conversation={conversation} />
      
      <MessageList conversationId={conversationId} />
      
      <MessageInput
        value={message}
        onChange={setMessage}
        onSend={handleSend}
        disabled={createMessage.isPending}
        placeholder="Digite sua mensagem..."
      />
    </div>
  );
}