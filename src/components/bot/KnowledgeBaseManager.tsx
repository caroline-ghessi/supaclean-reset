import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Trash2, CheckCircle, Clock, AlertCircle,
  File, FileSpreadsheet, FileImage, Download, Search, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKnowledgeFiles, useUploadKnowledgeFile, useDeleteKnowledgeFile } from '@/hooks/useKnowledgeFiles';
import { ProductCategory } from '@/types/conversation.types';
import { formatFileSize } from '@/lib/utils';
import { SemanticSearchTest } from './SemanticSearchTest';
import { WebScrapingTab } from './WebScrapingTab';

interface KnowledgeBaseManagerProps {
  agentCategory: ProductCategory;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'text/csv': '.csv'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function KnowledgeBaseManager({ agentCategory }: KnowledgeBaseManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: files, isLoading } = useKnowledgeFiles(agentCategory);
  const uploadMutation = useUploadKnowledgeFile();
  const deleteMutation = useDeleteKnowledgeFile();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(file => {
      // Validate file type
      if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
        alert(`Tipo de arquivo não suportado: ${file.type}`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`Arquivo muito grande: ${file.name}. Máximo permitido: 50MB`);
        return;
      }

      uploadMutation.mutate({ file, agentCategory });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) 
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (fileType.includes('wordprocessingml')) 
      return <File className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Processado</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Tabs defaultValue="files" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="files" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Arquivos
        </TabsTrigger>
        <TabsTrigger value="web-scraping" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Web Scraping
        </TabsTrigger>
        <TabsTrigger value="search" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Busca Semântica
        </TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="mt-6 space-y-6">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Base de Conhecimento - {agentCategory.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Suportamos PDF, Word (.docx), Excel (.xlsx, .xls) e CSV
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Tamanho máximo: 50MB por arquivo
              </p>
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Enviando...' : 'Selecionar Arquivos'}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={Object.values(ACCEPTED_FILE_TYPES).join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle>Arquivos na Base de Conhecimento</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : files && files.length > 0 ? (
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(file.file_type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{formatDate(file.created_at)}</span>
                          {file.extracted_content && (
                            <span>{file.extracted_content.length} caracteres extraídos</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(file.processing_status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(file)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Nenhum arquivo carregado ainda. Faça upload de documentos para alimentar a base de conhecimento deste agente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="web-scraping" className="mt-6">
        <WebScrapingTab agentCategory={agentCategory} />
      </TabsContent>

      <TabsContent value="search" className="mt-6">
        <SemanticSearchTest agentCategory={agentCategory} />
      </TabsContent>
    </Tabs>
  );
}