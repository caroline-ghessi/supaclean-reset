import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';
import { ConversationItem } from './ConversationItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationFilters } from '@/types/conversation.types';

interface ConversationListProps {
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function ConversationList({ onSelect, selectedId }: ConversationListProps) {
  const [filters, setFilters] = useState<ConversationFilters>({});
  const { data: conversations, isLoading } = useConversations();
  
  // Enable realtime updates
  useRealtimeConversations();

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined }));
  };

  if (isLoading) {
    return (
      <div className="w-96 bg-card border-r border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-border">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-10"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
        </div>
      </div>
      
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations && conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={() => onSelect(conversation.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}