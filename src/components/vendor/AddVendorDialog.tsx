import { useState } from 'react';
import { Plus, User, Phone, Settings, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getVendorTokenSecretName } from '@/utils/vendorTokens';

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorForm {
  name: string;
  phone_number: string;
  whapi_channel_id: string;
  is_active: boolean;
}

export function AddVendorDialog({ open, onOpenChange }: AddVendorDialogProps) {
  const [formData, setFormData] = useState<VendorForm>({
    name: '',
    phone_number: '',
    whapi_channel_id: '',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newVendorId, setNewVendorId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone_number || !formData.whapi_channel_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Inserir vendedor sem token (será configurado separadamente)
      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert([{
          ...formData,
          token_configured: false
        }])
        .select('id')
        .single();

      if (error) throw error;

      setNewVendorId(vendor.id);

      toast({
        title: 'Vendedor adicionado',
        description: `${formData.name} foi adicionado. Configure o token para ativar o monitoramento.`,
        variant: 'default'
      });

      // Refresh vendors list
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar vendedor',
        description: error.message || 'Ocorreu um erro ao adicionar o vendedor.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setFormData({
      name: '',
      phone_number: '',
      whapi_channel_id: '',
      is_active: true
    });
    setNewVendorId(null);
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Vendedor
          </DialogTitle>
          <DialogDescription>
            Configure um novo vendedor para monitoramento em tempo real das conversas WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome do Vendedor
            </Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número do WhatsApp
            </Label>
            <Input
              id="phone"
              placeholder="Ex: 5511999887766"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato: código do país + DDD + número (sem espaços ou símbolos)
            </p>
          </div>

          {newVendorId && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-orange-800 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Configurar Token (Obrigatório)</span>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                Para ativar o monitoramento, configure o token do Whapi Cloud nos Supabase Secrets:
              </p>
              <div className="bg-orange-100 rounded p-2 text-xs font-mono text-orange-800 mb-3">
                Nome do Secret: {getVendorTokenSecretName(newVendorId)}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  // Trigger secret configuration
                  window.open(`#configure-secret-${newVendorId}`, '_blank');
                }}
                className="text-xs"
              >
                Configurar Token Agora
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="channel" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              ID do Canal
            </Label>
            <Input
              id="channel"
              placeholder="ID do canal Whapi Cloud"
              value={formData.whapi_channel_id}
              onChange={(e) => handleInputChange('whapi_channel_id', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="active">Ativar monitoramento imediatamente</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={isLoading}
            >
              {newVendorId ? 'Fechar' : 'Cancelar'}
            </Button>
            {!newVendorId && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adicionando...' : 'Adicionar Vendedor'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}