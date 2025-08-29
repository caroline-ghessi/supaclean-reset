import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useVendorTokenTest, VendorTestResult } from '@/hooks/useVendorTokenTest';
import { useToast } from '@/hooks/use-toast';

interface VendorStatusDiagnosticProps {
  vendor: {
    id: string;
    name: string;
    phone_number: string;
    is_active: boolean;
    token_configured: boolean;
  };
  onStatusUpdate?: () => void;
}

export function VendorStatusDiagnostic({ vendor, onStatusUpdate }: VendorStatusDiagnosticProps) {
  const { testVendorIntegration, loading, result, error, reset } = useVendorTokenTest();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const handleTest = async () => {
    try {
      await testVendorIntegration(vendor.id);
      toast({
        title: "Teste concluído",
        description: "Diagnóstico da integração executado com sucesso.",
      });
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      toast({
        title: "Erro no teste",
        description: "Falha ao executar o diagnóstico da integração.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (success: boolean | undefined, warning = false) => {
    if (success === undefined) return null;
    if (warning) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return success ? 
      <CheckCircle className="h-4 w-4 text-success" /> : 
      <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (success: boolean | undefined, label: string, warning = false) => {
    const variant = success === undefined ? 'secondary' : 
                   warning ? 'outline' :
                   success ? 'default' : 'destructive';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(success, warning)}
        {label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Diagnóstico da Integração</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Ocultar' : 'Expandir'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Testar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Básico */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Status do Vendor</span>
            {getStatusBadge(vendor.is_active, vendor.is_active ? 'Ativo' : 'Inativo')}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Token Configurado</span>
            {getStatusBadge(vendor.token_configured, vendor.token_configured ? 'Configurado' : 'Pendente')}
          </div>
        </div>

        {/* Resultados do Teste */}
        {result && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Resultados do Teste</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Secret Supabase</span>
                  {getStatusBadge(
                    result.token_status.secret_exists, 
                    result.token_status.secret_exists ? 'Existe' : 'Não encontrado'
                  )}
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Status no DB</span>
                  {getStatusBadge(
                    result.token_status.db_configured,
                    result.token_status.db_configured ? 'Configurado' : 'Não configurado'
                  )}
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Webhook</span>
                  {getStatusBadge(
                    result.webhook_test.success,
                    result.webhook_test.success ? 'Funcionando' : 'Com erro'
                  )}
                </div>
              </div>

              {result.token_status.auto_updated && (
                <Alert>
                  <RefreshCw className="h-4 w-4" />
                  <AlertDescription>
                    Status do token foi atualizado automaticamente no banco de dados.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Detalhes Expandidos */}
        {expanded && result && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Detalhes Técnicos</h4>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">URL do Webhook:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted p-1 rounded flex-1">
                      {result.webhook_test.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(result.webhook_test.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {result.webhook_test.status && (
                  <div>
                    <span className="text-sm font-medium">Status HTTP:</span>
                    <Badge variant={result.webhook_test.status < 400 ? 'default' : 'destructive'} className="ml-2">
                      {result.webhook_test.status}
                    </Badge>
                  </div>
                )}

                {result.webhook_test.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Erro no webhook: {result.webhook_test.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao executar teste: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Instruções */}
        {!result && !loading && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Clique em "Testar" para executar um diagnóstico completo da integração do vendor.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}