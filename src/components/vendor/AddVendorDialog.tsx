import { useState } from 'react';
import { Plus, User, Phone, Key, Settings } from 'lucide-react';
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

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVendorDialog({ open, onOpenChange }: AddVendorDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    whapi_token: '',
    whapi_channel_id: '',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone_number || !formData.whapi_token || !formData.whapi_channel_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('vendors')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Vendedor adicionado',
        description: `${formData.name} foi adicionado com sucesso ao sistema de monitoramento.`
      });

      // Reset form
      setFormData({
        name: '',
        phone_number: '',
        whapi_token: '',
        whapi_channel_id: '',
        is_active: true
      });

      // Refresh vendors list
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar vendedor',
        description: error.message || 'Ocorreu um erro ao adicionar o vendedor.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
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

          <div className="space-y-2">
            <Label htmlFor="token" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Token Whapi Cloud
            </Label>
            <Input
              id="token"
              placeholder="Token do canal Whapi Cloud"
              value={formData.whapi_token}
              onChange={(e) => handleInputChange('whapi_token', e.target.value)}
              disabled={isLoading}
              required
              type="password"
            />
          </div>

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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adicionando...' : 'Adicionar Vendedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}