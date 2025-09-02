import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Archive } from 'lucide-react';

interface CloseConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function CloseConversationDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isLoading = false 
}: CloseConversationDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const reasons = [
    { value: 'cliente_atendido', label: 'Cliente atendido - Enviado ao vendedor' },
    { value: 'produto_indisponivel', label: 'Produto não disponível' },
    { value: 'cliente_desistiu', label: 'Cliente desistiu' },
    { value: 'spam_bot', label: 'Spam ou bot malicioso' },
    { value: 'fora_escopo', label: 'Assunto fora do escopo' },
    { value: 'outro', label: 'Outro motivo' }
  ];

  const handleConfirm = () => {
    const reason = selectedReason === 'outro' ? customReason : 
                  reasons.find(r => r.value === selectedReason)?.label || selectedReason;
    
    if (reason) {
      onConfirm(reason);
      setSelectedReason('');
      setCustomReason('');
    }
  };

  const isValid = selectedReason && (selectedReason !== 'outro' || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Finalizar Conversa
          </DialogTitle>
          <DialogDescription>
            A conversa será arquivada mas o histórico será preservado. Se o cliente entrar em contato novamente, 
            a conversa será reativada automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Motivo do arquivamento:</Label>
            <RadioGroup 
              value={selectedReason} 
              onValueChange={setSelectedReason}
              className="mt-2 space-y-2"
            >
              {reasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="text-sm">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === 'outro' && (
            <div>
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Descreva o motivo:
              </Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Digite o motivo do arquivamento..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            {isLoading ? 'Finalizando...' : 'Finalizar Conversa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}