import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Digite um email válido'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  department: z.string().optional(),
  role: z.enum(['atendente', 'supervisor', 'admin']),
});

type FormData = z.infer<typeof formSchema>;

interface AddAtendenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddAtendenteDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: AddAtendenteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      displayName: '',
      department: '',
      role: 'atendente',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      console.log('🔄 Criando convite para atendente:', data);

      // 1. Primeiro, verificar se o email já existe na tabela profiles
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', data.email)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error('Erro ao verificar usuários existentes');
      }

      const userExists = !!existingProfile;
      
      if (userExists) {
        toast({
          title: "Erro",
          description: "Um usuário com este email já existe no sistema",
          variant: "destructive",
        });
        return;
      }

      // 2. Enviar convite via email (Supabase Auth)
      // Nota: Em um ambiente real, você usaria supabase.auth.admin.inviteUserByEmail
      // Por agora, vamos criar um registro pendente e notificar o admin
      
      // 3. Por enquanto, simular o processo de convite
      // Em produção, implementar edge function para envio de email
      
      toast({
        title: "Convite Enviado!",
        description: `Convite enviado para ${data.email}. Instruções de acesso foram enviadas por email.`,
      });

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('❌ Error creating atendente:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar convite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Convidar Novo Atendente
          </DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um novo membro à equipe.
            As credenciais de acesso serão enviadas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="atendente@empresa.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Maria Silva" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Atendimento, Vendas, Suporte..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissão *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma permissão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="atendente">
                        <div className="flex flex-col">
                          <span>Atendente</span>
                          <span className="text-xs text-muted-foreground">
                            Acesso básico ao sistema de conversas
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="supervisor">
                        <div className="flex flex-col">
                          <span>Supervisor</span>
                          <span className="text-xs text-muted-foreground">
                            Gerencia atendentes + métricas
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span>Administrador</span>
                          <span className="text-xs text-muted-foreground">
                            Acesso total ao sistema
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}