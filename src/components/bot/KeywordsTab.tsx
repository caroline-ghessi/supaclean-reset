import { useState } from 'react';
import { Plus, Edit3, Trash2, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useClassificationKeywords, useAddKeyword, useDeleteKeyword } from '@/hooks/useClassificationKeywords';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryIcons: Record<string, string> = {
  energia_solar: '☀️',
  telha_shingle: '🏠',
  steel_frame: '🏗️',
  drywall_divisorias: '🧱',
  ferramentas: '🔧',
  pisos: '📐',
  acabamentos: '🎨',
  forros: '📋',
  saudacao: '👋',
  institucional: 'ℹ️'
};

const categoryNames: Record<string, string> = {
  energia_solar: 'Energia Solar',
  telha_shingle: 'Telhas Shingle',
  steel_frame: 'Steel Frame',
  drywall_divisorias: 'Drywall/Divisórias',
  ferramentas: 'Ferramentas',
  pisos: 'Pisos',
  acabamentos: 'Acabamentos',
  forros: 'Forros',
  saudacao: 'Saudação',
  institucional: 'Institucional'
};

export function KeywordsTab() {
  const { data: keywords = [], isLoading, error } = useClassificationKeywords();
  const { mutate: addKeyword } = useAddKeyword();
  const { mutate: deleteKeyword } = useDeleteKeyword();
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Debug logging
  console.log('KeywordsTab - Data:', { keywords, isLoading, error, total: keywords?.length });

  // Agrupar palavras-chave por categoria
  const keywordsByCategory = keywords.reduce((acc, keyword) => {
    if (!acc[keyword.category]) {
      acc[keyword.category] = [];
    }
    acc[keyword.category].push(keyword);
    return acc;
  }, {} as Record<string, typeof keywords>);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && selectedCategory) {
      addKeyword({
        category: selectedCategory,
        keyword: newKeyword.trim(),
        weight: 5,
        is_active: true
      });
      setNewKeyword('');
      setSelectedCategory('');
      setIsDialogOpen(false);
    }
  };

  // Estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando palavras-chave...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium">Erro ao carregar palavras-chave</p>
          <p className="text-xs text-destructive/80 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com Ações e Dados */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-foreground">Palavras-chave por Categoria</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Defina as palavras que ativam cada categoria de atendimento • {keywords.length} palavras cadastradas
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Palavra-chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Palavra-chave</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryNames).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {categoryIcons[key]} {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Palavra-chave</Label>
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Digite a palavra-chave..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
              </div>
              <Button onClick={handleAddKeyword} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Categorias */}
      {Object.keys(keywordsByCategory).length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <h4 className="font-medium text-foreground mb-1">Nenhuma palavra-chave encontrada</h4>
          <p className="text-sm text-muted-foreground mb-4">Adicione palavras-chave para começar a classificar mensagens automaticamente</p>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Primeira Palavra-chave
          </Button>
        </div>
      ) : (
        Object.entries(keywordsByCategory).map(([category, categoryKeywords]) => {
        const totalActivations = Math.floor(Math.random() * 50) + 10; // Mock data
        const accuracyRate = Math.floor(Math.random() * 20) + 80; // Mock data
        
        return (
          <div key={category} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categoryIcons[category] || '📋'}</span>
                <div>
                  <h4 className="font-medium text-foreground">{categoryNames[category] || category}</h4>
                  <p className="text-xs text-muted-foreground">
                    {categoryKeywords.length} palavras-chave ativas
                  </p>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-2 mb-3">
              {categoryKeywords.map((keyword) => (
                <Badge
                  key={keyword.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {keyword.keyword}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:text-destructive"
                    onClick={() => deleteKeyword(keyword.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            {/* Estatísticas */}
            <div className="flex items-center gap-4 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Ativações hoje: <strong>{totalActivations}</strong>
              </span>
              <span className="text-xs text-muted-foreground">
                Taxa de acerto: <strong>{accuracyRate}%</strong>
              </span>
              <span className="text-xs text-muted-foreground">
                Última ativação: <strong>há {Math.floor(Math.random() * 60)} min</strong>
              </span>
            </div>
          </div>
        );
      }))}
    </div>
  );
}