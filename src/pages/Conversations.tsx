import { useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatArea } from '@/components/chat/ChatArea';
import { EmptyState } from '@/components/chat/EmptyState';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';

export function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Enable realtime updates for conversations list
  useRealtimeConversations();

  return (
    <div className="flex h-full bg-background">
      <ConversationList 
        onSelect={setSelectedConversationId}
        selectedId={selectedConversationId}
      />
      
      {selectedConversationId ? (
        <ChatArea conversationId={selectedConversationId} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}