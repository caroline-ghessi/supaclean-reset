import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Globe, FileText, Zap } from 'lucide-react';
import { ProductCategory } from '@/types/conversation.types';
import { useFirecrawlScrape } from '@/hooks/useFirecrawl';

interface WebScrapingTabProps {
  agentCategory: ProductCategory;
}

const AGENT_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'energia_solar', label: 'Energia Solar' },
  { value: 'telha_shingle', label: 'Telha Shingle' },
  { value: 'steel_frame', label: 'Steel Frame' },
  { value: 'drywall_divisorias', label: 'Drywall' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'pisos', label: 'Pisos' },
  { value: 'acabamentos', label: 'Acabamentos' },
  { value: 'forros', label: 'Forros' },
  { value: 'saudacao', label: 'Saudação/Geral' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'indefinido', label: 'Indefinido' },
];

export function WebScrapingTab({ agentCategory }: WebScrapingTabProps) {
  const [url, setUrl] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<ProductCategory>(agentCategory);
  const [mode, setMode] = useState<'scrape' | 'crawl'>('scrape');
  const [maxDepth, setMaxDepth] = useState('3');
  const [includePatterns, setIncludePatterns] = useState('');
  const [excludePatterns, setExcludePatterns] = useState('');

  const firecrawlMutation = useFirecrawlScrape();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      return;
    }

    const includeArray = includePatterns
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    const excludeArray = excludePatterns
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    firecrawlMutation.mutate({
      url: url.trim(),
      agentCategory: selectedAgent,
      mode,
      options: {
        maxDepth: parseInt(maxDepth),
        includePatterns: includeArray.length > 0 ? includeArray : undefined,
        excludePatterns: excludeArray.length > 0 ? excludeArray : undefined,
      },
    });
  };

  const isLoading = firecrawlMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Extração de Conteúdo Web
          </CardTitle>
          <CardDescription>
            Use o Firecrawl para extrair conteúdo de páginas web e adicionar à base de conhecimento dos agentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent-select">Agente de Destino</Label>
                <Select value={selectedAgent} onValueChange={(value) => setSelectedAgent(value as ProductCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemplo.com/artigo"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Modo de Extração</Label>
              <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'scrape' | 'crawl')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scrape" id="scrape" />
                  <Label htmlFor="scrape" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Página Única - Extrair conteúdo de uma página específica
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crawl" id="crawl" />
                  <Label htmlFor="crawl" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Site Completo - Rastrear e extrair múltiplas páginas
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {mode === 'crawl' && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Opções de Crawling</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="max-depth">Profundidade Máxima</Label>
                  <Select value={maxDepth} onValueChange={setMaxDepth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 nível</SelectItem>
                      <SelectItem value="2">2 níveis</SelectItem>
                      <SelectItem value="3">3 níveis</SelectItem>
                      <SelectItem value="5">5 níveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="include-patterns">Padrões para Incluir</Label>
                    <Textarea
                      id="include-patterns"
                      value={includePatterns}
                      onChange={(e) => setIncludePatterns(e.target.value)}
                      placeholder="/blog/*&#10;/artigos/*&#10;/categoria/*"
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Um padrão por linha. Ex: /blog/* para incluir apenas URLs do blog
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exclude-patterns">Padrões para Excluir</Label>
                    <Textarea
                      id="exclude-patterns"
                      value={excludePatterns}
                      onChange={(e) => setExcludePatterns(e.target.value)}
                      placeholder="/admin/*&#10;/login/*&#10;*.pdf"
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Um padrão por linha. Ex: /admin/* para excluir URLs administrativas
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isLoading || !url.trim()} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'scrape' ? 'Extraindo página...' : 'Rastreando site...'}
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  {mode === 'scrape' ? 'Extrair Página' : 'Rastrear Site'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Example URLs for quick testing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">URLs de Exemplo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Página única:</strong> https://blog.exemplo.com/artigo-energia-solar</p>
            <p><strong>Site completo:</strong> https://blog.exemplo.com (com padrões /energia-solar/*)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}