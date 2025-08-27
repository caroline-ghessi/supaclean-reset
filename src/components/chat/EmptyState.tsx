import { MessageCircle, Users, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Bem-vindo ao Drystore Chat
          </h3>
          <p className="text-muted-foreground">
            Selecione uma conversa à esquerda para começar a responder clientes ou inicie uma nova conversa.
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
          
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Ver Todas as Conversas
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Dicas Rápidas</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use Ctrl+Enter para enviar mensagens</li>
            <li>• Conversas em tempo real com WebSocket</li>
            <li>• Filtros por produto e temperatura de lead</li>
          </ul>
        </div>
      </div>
    </div>
  );
}