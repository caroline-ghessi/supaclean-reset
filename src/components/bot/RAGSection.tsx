import { useState } from 'react';
import { Search, Brain, MessageCircle, TrendingUp, FileText, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRAGSearch, useKnowledgeAnalytics, useFAQPatterns, useGenerateEmbeddings } from '@/hooks/useRAGSystem';
import { useKnowledgeFiles } from '@/hooks/useKnowledgeFiles';
import { ProductCategory } from '@/types/conversation.types';
import { toast } from 'sonner';

export function RAGSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentType, setSelectedAgentType] = useState<ProductCategory>('energia_solar');
  
  const ragSearch = useRAGSearch();
  const knowledgeAnalytics = useKnowledgeAnalytics(selectedAgentType);
  const faqPatterns = useFAQPatterns(selectedAgentType);
  const { data: knowledgeFiles } = useKnowledgeFiles(selectedAgentType);
  const generateEmbeddings = useGenerateEmbeddings();

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Digite uma pergunta para pesquisar');
      return;
    }

    ragSearch.mutate({
      query: searchQuery,
      agentType: selectedAgentType,
      threshold: 0.7,
      limit: 10
    });
  };

  const handleGenerateEmbeddings = (fileId: string) => {
    generateEmbeddings.mutate(fileId);
  };

  const agentTypes = [
    { value: 'energia_solar', label: 'Energia Solar' },
    { value: 'telha_shingle', label: 'Telha Shingle' },
    { value: 'steel_frame', label: 'Steel Frame' },
    { value: 'drywall_divisorias', label: 'Drywall' },
    { value: 'ferramentas', label: 'Ferramentas' },
    { value: 'pisos', label: 'Pisos' },
    { value: 'acabamentos', label: 'Acabamentos' },
    { value: 'forros', label: 'Forros' },
    { value: 'geral', label: 'Geral' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sistema RAG</h2>
          <p className="text-muted-foreground">
            Busca semântica e análise da base de conhecimento
          </p>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Busca Semântica</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="faq">FAQ Patterns</TabsTrigger>
          <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Busca Semântica
              </CardTitle>
              <CardDescription>
                Teste a busca por conhecimento relevante na base de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <select 
                  value={selectedAgentType}
                  onChange={(e) => setSelectedAgentType(e.target.value as ProductCategory)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  {agentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Digite sua pergunta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={ragSearch.isPending}
                >
                  {ragSearch.isPending ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>

              {ragSearch.data && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Resultados encontrados:</h3>
                  {ragSearch.data.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                  ) : (
                    ragSearch.data.map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">
                            Similaridade: {(result.similarity * 100).toFixed(1)}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.file_name} - Chunk {result.chunk_index + 1}
                          </span>
                        </div>
                        <p className="text-sm">{result.content}</p>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {knowledgeAnalytics.data?.reduce((acc, day) => acc + day.total_queries, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {knowledgeAnalytics.data?.length > 0 
                    ? Math.round(
                        (knowledgeAnalytics.data.reduce((acc, day) => acc + day.successful_responses, 0) / 
                         knowledgeAnalytics.data.reduce((acc, day) => acc + day.total_queries, 0)) * 100
                      ) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Respostas bem-sucedidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {knowledgeAnalytics.data?.length > 0
                    ? (knowledgeAnalytics.data.reduce((acc, day) => acc + day.average_confidence, 0) / 
                       knowledgeAnalytics.data.length).toFixed(1)
                    : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">Score de confiabilidade</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conhecimento Usado</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {knowledgeAnalytics.data?.reduce((acc, day) => acc + day.knowledge_entries_used, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Entradas utilizadas</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Padrões de FAQ Identificados</CardTitle>
              <CardDescription>
                Perguntas frequentes detectadas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faqPatterns.data?.length === 0 ? (
                <p className="text-muted-foreground">Nenhum padrão de FAQ encontrado ainda</p>
              ) : (
                <div className="space-y-3">
                  {faqPatterns.data?.map((pattern, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">
                          Frequência: {pattern.frequency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {pattern.intent}
                        </span>
                      </div>
                      <p className="text-sm">{pattern.pattern_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Último visto: {new Date(pattern.last_seen).toLocaleDateString('pt-BR')}
                      </p>
                    </Card>
                  )) || []}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embeddings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Embeddings</CardTitle>
              <CardDescription>
                Gerar embeddings para arquivos que ainda não foram processados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {knowledgeFiles?.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
                ) : (
                  knowledgeFiles?.map((file) => (
                    <Card key={file.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{file.file_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Status: {file.processing_status}
                          </p>
                          {file.processed_at && (
                            <p className="text-xs text-muted-foreground">
                              Processado: {new Date(file.processed_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {file.chunks_count && file.chunks_count > 0 ? (
                            <Badge variant="default">
                              Com Embeddings ({file.chunks_count} chunks)
                            </Badge>
                          ) : file.processing_status === 'completed_with_embeddings' ? (
                            <Badge variant="default">
                              Com Embeddings
                            </Badge>
                          ) : file.processing_status === 'processing' ? (
                            <Badge variant="outline">
                              Processando...
                            </Badge>
                          ) : file.processing_status === 'error' ? (
                            <Badge variant="destructive">
                              Erro
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Sem Embeddings
                            </Badge>
                          )}
                          {file.processing_status === 'completed' && (!file.chunks_count || file.chunks_count === 0) && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateEmbeddings(file.id)}
                              disabled={generateEmbeddings.isPending}
                            >
                              Gerar Embeddings
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )) || []
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}