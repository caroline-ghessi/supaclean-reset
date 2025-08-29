import { useState } from 'react';
import { Shield, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getVendorTokenSecretName, getTokenStatusLabel, getTokenStatusColor } from '@/utils/vendorTokens';

interface TokenConfigurationButtonProps {
  vendorId: string;
  vendorName: string;
  tokenConfigured: boolean;
  onTokenConfigured?: () => void;
}

export function TokenConfigurationButton({ 
  vendorId, 
  vendorName, 
  tokenConfigured, 
  onTokenConfigured 
}: TokenConfigurationButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  
  const secretName = getVendorTokenSecretName(vendorId);
  const status = tokenConfigured ? 'configured' : 'pending';
  const statusLabel = getTokenStatusLabel(status);
  const statusColor = getTokenStatusColor(status);

  const handleConfigureToken = () => {
    // Aqui você integraria com o sistema de secrets do Supabase
    // Por enquanto, abrimos um dialog com instruções
    setShowDialog(true);
  };

  return (
    <>
      <Button
        variant={tokenConfigured ? "outline" : "destructive"}
        size="sm"
        onClick={handleConfigureToken}
        className="gap-2"
      >
        {tokenConfigured ? (
          <>
            <Check className="h-4 w-4" />
            Token OK
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            Configurar Token
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurar Token - {vendorName}
            </DialogTitle>
            <DialogDescription>
              Configure o token do Whapi Cloud nos Supabase Secrets para ativar o monitoramento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Status:</strong> <span className={statusColor}>{statusLabel}</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome do Secret:</label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                  {secretName}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Webhook URL:</label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/vendor-whatsapp-webhook?vendor_id={vendorId}
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Próximos passos:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Acesse o painel de Secrets do Supabase</li>
                    <li>Crie um novo secret com o nome acima</li>
                    <li>Insira o token do Whapi Cloud como valor</li>
                    <li>Configure o webhook no Whapi Cloud</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  window.open('https://supabase.com/dashboard/project/groqsnnytvjabgeaekkw/settings/functions', '_blank');
                }}
              >
                Abrir Secrets
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}