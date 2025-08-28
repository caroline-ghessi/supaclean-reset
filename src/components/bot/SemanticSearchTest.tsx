import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { ProductCategory } from '@/types/conversation.types';
import { Search, FileText, Target } from 'lucide-react';

interface SemanticSearchTestProps {
  agentCategory: ProductCategory;
}

export function SemanticSearchTest({ agentCategory }: SemanticSearchTestProps) {
  const [query, setQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');

  const { data: results, isLoading, error } = useSemanticSearch({
    query: searchTrigger,
    agentCategory,
    enabled: !!searchTrigger
  });

  const handleSearch = () => {
    setSearchTrigger(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Teste de Busca Semântica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua pergunta para testar a busca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button 
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">
            Erro na busca: {error.message}
          </div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Resultados encontrados ({results.length}):
            </h4>
            
            {results.map((result, index) => (
              <Card key={result.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{result.file_name}</span>
                      {result.chunk_index !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          Chunk {result.chunk_index + 1}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(result.similarity * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {result.content}
                  </p>
                  
                  {result.metadata && Object.keys(result.metadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Metadata: {JSON.stringify(result.metadata, null, 2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searchTrigger && results && results.length === 0 && !isLoading && (
          <div className="p-4 rounded bg-muted/50 text-center text-sm text-muted-foreground">
            Nenhum resultado encontrado para "{searchTrigger}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}