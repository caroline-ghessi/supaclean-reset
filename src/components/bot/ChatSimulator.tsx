import React from 'react';

interface ChatBubbleProps {
  sender: 'customer' | 'bot';
  message: string;
  time: string;
}

function ChatBubble({ sender, message, time }: ChatBubbleProps) {
  return (
    <div className={`flex ${sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        sender === 'customer' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-foreground'
      }`}>
        <p className="text-sm">{message}</p>
        <p className={`text-xs mt-1 ${
          sender === 'customer' 
            ? 'text-primary-foreground/70' 
            : 'text-muted-foreground'
        }`}>
          {time}
        </p>
      </div>
    </div>
  );
}

export function ChatSimulator() {
  return (
    <div className="bg-muted/30 rounded-lg p-4 h-96 overflow-y-auto">
      <div className="space-y-3">
        <ChatBubble
          sender="customer"
          message="Olá, quero saber sobre energia solar"
          time="14:32"
        />
        <ChatBubble
          sender="bot"
          message="Ótimo interesse em energia solar! Para fazer um orçamento preciso, qual o valor médio da sua conta de luz?"
          time="14:32"
        />
        <ChatBubble
          sender="customer"
          message="Minha conta fica em torno de R$ 350 por mês"
          time="14:33"
        />
        <ChatBubble
          sender="bot"
          message="Perfeito! Com esse consumo, você pode economizar cerca de 95% na sua conta. Você gostaria de incluir um sistema de baterias no seu projeto para ter energia mesmo durante quedas da rede elétrica?"
          time="14:33"
        />
      </div>
    </div>
  );
}