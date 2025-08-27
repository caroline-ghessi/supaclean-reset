export function WhatsAppEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-chat-background">
      <div className="text-center max-w-md mx-auto px-8">
        {/* WhatsApp-style logo/icon */}
        <div className="w-64 h-64 mx-auto mb-8 flex items-center justify-center">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
            <svg 
              className="w-16 h-16 text-primary/60" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm4.52 7.16l-2.84 2.84c-.39.39-1.04.39-1.43 0L9.64 9.35c-.39-.39-.39-1.04 0-1.43l2.84-2.84c.39-.39 1.04-.39 1.43 0l2.84 2.84c.39.39.39 1.04 0 1.43z"/>
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-light text-foreground mb-4">
          WhatsApp Business Drystore
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Selecione uma conversa para começar o atendimento aos seus clientes.
          <br />
          Todas as mensagens são sincronizadas em tempo real.
        </p>
        
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Conectado ao WhatsApp Business</span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Bot inteligente ativo</span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Leads sendo qualificados automaticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
}