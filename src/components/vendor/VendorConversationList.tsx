import { useState, useEffect } from 'react';
import { MessageSquare, User, Clock } from 'lucide-react';
import { useVendorConversations } from '@/hooks/useVendorConversations';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VendorConversationListProps {
  vendorId: string;
  searchTerm: string;
  onSelectConversation: (conversation: any) => void;
  selectedConversation: any;
}

export function VendorConversationList({ 
  vendorId, 
  searchTerm, 
  onSelectConversation, 
  selectedConversation 
}: VendorConversationListProps) {
  const { data: conversations, isLoading } = useVendorConversations(vendorId);

  const filteredConversations = conversations?.filter(conversation =>
    conversation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.customer_phone.includes(searchTerm)
  ) || [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ativa'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {filteredConversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
            selectedConversation?.id === conversation.id ? 'bg-muted' : ''
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.customer_profile_pic} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">
                  {conversation.customer_name || 'Cliente'}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {new Date(conversation.last_message_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {conversation.customer_phone}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {conversation.total_messages} msgs
                  </Badge>
                  
                  {conversation.conversation_status === 'active' && (
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(conversation.last_message_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}