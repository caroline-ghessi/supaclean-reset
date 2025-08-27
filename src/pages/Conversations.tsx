import { useState } from 'react';
import { WhatsAppConversationList } from '@/components/chat/WhatsAppConversationList';
import { WhatsAppChatArea } from '@/components/chat/WhatsAppChatArea';
import { WhatsAppEmptyState } from '@/components/chat/WhatsAppEmptyState';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';

export function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Enable realtime updates for conversations list
  useRealtimeConversations();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
  );
}