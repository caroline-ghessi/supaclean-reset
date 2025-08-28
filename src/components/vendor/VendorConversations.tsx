import { useState } from 'react';
import { MessageSquare, User, Clock, Search } from 'lucide-react';
import { VendorConversationList } from './VendorConversationList';
import { VendorChatArea } from './VendorChatArea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface VendorConversationsProps {
  vendor: any;
}

export function VendorConversations({ vendor }: VendorConversationsProps) {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex h-full">
      {/* Header com info do vendedor */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{vendor.name}</h3>
              <p className="text-sm text-muted-foreground">{vendor.phone_number}</p>
            </div>
            <Badge variant={vendor.is_active ? "default" : "secondary"} className="ml-auto">
              {vendor.is_active ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>

        {/* Busca */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-hidden">
          <VendorConversationList
            vendorId={vendor.id}
            searchTerm={searchTerm}
            onSelectConversation={setSelectedConversation}
            selectedConversation={selectedConversation}
          />
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <VendorChatArea 
            conversation={selectedConversation}
            vendor={vendor}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/5">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Selecione uma conversa</p>
              <p className="text-sm">Escolha uma conversa da lista para visualizar as mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}