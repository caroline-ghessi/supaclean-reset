import { useState } from 'react';
import { WhatsAppConversationList } from '@/components/chat/WhatsAppConversationList';
import { WhatsAppChatArea } from '@/components/chat/WhatsAppChatArea';
import { WhatsAppEmptyState } from '@/components/chat/WhatsAppEmptyState';
import { ConversationsHeader } from '@/components/chat/ConversationsHeader';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';

export function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Enable realtime updates for conversations list
  useRealtimeConversations();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ConversationsHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <WhatsAppConversationList 
          onSelect={setSelectedConversationId}
          selectedId={selectedConversationId}
        />
        
        {selectedConversationId ? (
          <WhatsAppChatArea conversationId={selectedConversationId} />
        ) : (
          <WhatsAppEmptyState />
        )}
      </div>
    </div>
  );
}