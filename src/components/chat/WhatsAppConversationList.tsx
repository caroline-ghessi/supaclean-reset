import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Filter, Plus, Archive, ArchiveRestore } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';
import { WhatsAppConversationItem } from './WhatsAppConversationItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationFilters } from '@/types/conversation.types';

interface WhatsAppConversationListProps {
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function WhatsAppConversationList({ onSelect, selectedId }: WhatsAppConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [showArchived, setShowArchived] = useState(false);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Combine search with filters
  const combinedFilters = useMemo(() => ({
    ...filters,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    includeArchived: showArchived
  }), [filters, debouncedSearchTerm, showArchived]);

  const { data: conversations, isLoading } = useConversations(combinedFilters);
  useRealtimeConversations();

  const handleFilterChange = (key: keyof ConversationFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : [value]
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined) || searchTerm;

  return (
    <div className="w-[400px] bg-chat-list-background border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="bg-chat-header px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">
            Conversas {showArchived && '(Arquivadas)'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={`${showArchived ? 'bg-primary/10 text-primary' : ''} text-xs`}
              title={showArchived ? 'Mostrar conversas ativas' : 'Mostrar conversas arquivadas'}
            >
              {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10 text-primary" : ""}
            >
              <Filter size={18} />
            </Button>
            <Button variant="ghost" size="sm">
              <Plus size={18} />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar conversa ou cliente..."
            className="pl-10 bg-background border-input rounded-lg"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-primary/5 p-4 border-b border-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={filters.status?.[0] || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="bot">Com Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Produto</label>
              <Select value={filters.product_group?.[0] || 'all'} onValueChange={(value) => handleFilterChange('product_group', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="energia_solar">☀️ Energia Solar</SelectItem>
                  <SelectItem value="telha_shingle">🏠 Telhas Shingle</SelectItem>
                  <SelectItem value="steel_frame">🏗️ Steel Frame</SelectItem>
                  <SelectItem value="drywall_divisorias">🧱 Drywall</SelectItem>
                  <SelectItem value="ferramentas">🔧 Ferramentas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filters.lead_temperature?.includes('hot') ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleFilterChange('lead_temperature', filters.lead_temperature?.includes('hot') ? 'all' : 'hot')}
            >
              🔥 Quente
            </Button>
            <Button
              variant={filters.lead_temperature?.includes('warm') ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleFilterChange('lead_temperature', filters.lead_temperature?.includes('warm') ? 'all' : 'warm')}
            >
              🌡️ Morno
            </Button>
            <Button
              variant={filters.lead_temperature?.includes('cold') ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleFilterChange('lead_temperature', filters.lead_temperature?.includes('cold') ? 'all' : 'cold')}
            >
              ❄️ Frio
            </Button>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {conversations?.length || 0} resultado(s)
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6">
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center px-4 py-3 space-x-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="text-xs">
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        ) : (
          conversations?.map((conversation) => (
            <WhatsAppConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}