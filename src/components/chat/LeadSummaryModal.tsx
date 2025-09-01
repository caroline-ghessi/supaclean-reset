import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Send, Edit3, Users, Clock, AlertCircle } from 'lucide-react';
import type { LeadSummaryData } from '@/hooks/useLeadSummary';

interface LeadSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summaryData: LeadSummaryData | null;
  vendors: Array<{ id: string; name: string; phone_number: string }>;
  onSendToVendor: (vendorId: string, editedSummary: string) => void;
  sending: boolean;
}

export function LeadSummaryModal({
  open,
  onOpenChange,
  summaryData,
  vendors,
  onSendToVendor,
  sending
}: LeadSummaryModalProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Atualizar resumo editado quando summaryData muda
  useEffect(() => {
    if (summaryData?.summary) {
      setEditedSummary(summaryData.summary);
    }
  }, [summaryData?.summary]);

  const handleSend = () => {
    if (!selectedVendor || !editedSummary.trim()) return;
    onSendToVendor(selectedVendor, editedSummary);
  };

  if (!summaryData) return null;

  const { conversation, mediaFiles, contextData } = summaryData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo do Atendimento - {conversation?.customer_name || 'Cliente'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
          {/* Coluna Principal - Resumo */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Resumo para Vendedor</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    {isEditing ? 'Visualizar' : 'Editar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Edite o resumo conforme necessário..."
                  />
                ) : (
                  <ScrollArea className="h-[400px]">
                    <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                      {editedSummary}
                    </pre>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Seleção do Vendedor e Envio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Enviar para Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {vendor.name} - {vendor.phone_number}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSend}
                    disabled={!selectedVendor || !editedSummary.trim() || sending}
                    className="flex-1"
                  >
                    {sending ? 'Enviando...' : 'Enviar Lead'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral - Informações */}
          <div className="space-y-4">
            {/* Dados do Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <strong>Nome:</strong> {contextData?.nome}
                </div>
                <div>
                  <strong>WhatsApp:</strong> {contextData?.whatsapp}
                </div>
                <div>
                  <strong>Cidade/Estado:</strong> {contextData?.cidade}/{contextData?.estado}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline">
                    {contextData?.produto_grupo}
                  </Badge>
                  <Badge 
                    variant={
                      contextData?.temperatura === 'hot' ? 'destructive' :
                      contextData?.temperatura === 'warm' ? 'default' : 'secondary'
                    }
                  >
                    {contextData?.temperatura}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Arquivos de Mídia */}
            {mediaFiles && mediaFiles.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Arquivos Enviados ({mediaFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {file.type}
                          </Badge>
                          <span className="truncate">
                            {new Date(file.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Informações do Projeto */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Contexto do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div><strong>Urgência:</strong> {contextData?.urgencia}</div>
                <div><strong>Orçamento:</strong> {contextData?.orcamento}</div>
                <div><strong>Timeline:</strong> {contextData?.timeline}</div>
                <div><strong>Score:</strong> {contextData?.score}/100</div>
              </CardContent>
            </Card>

            {/* Aviso */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    Este resumo será enviado via WhatsApp usando o <strong>BOT DE LEADS</strong>. 
                    Revise as informações antes de enviar.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}