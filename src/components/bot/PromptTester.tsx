import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Play, 
  RotateCcw, 
  Settings,
  MessageSquare,
  Bot,
  User,
  Clock,
  Zap
} from 'lucide-react';
import { ProductCategory } from '@/types/conversation.types';

interface PromptTesterProps {
  selectedAgent: ProductCategory;
  selectedLLM: 'grok' | 'claude' | 'chatgpt';
  agentName: string;
}

interface TestMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  llm?: string;
  responseTime?: number;
}

export function PromptTester({ selectedAgent, selectedLLM, agentName }: PromptTesterProps) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testContext, setTestContext] = useState({
    customerName: 'João Silva',
    whatsappNumber: '+5511999999999',
    energyBill: '500',
    roofSize: '100'
  });

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: TestMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const botMessage: TestMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Resposta simulada do agente ${agentName} usando ${selectedLLM.toUpperCase()}. Esta é uma resposta de teste baseada na mensagem: "${currentMessage}"`,
        timestamp: new Date(),
        llm: selectedLLM,
        responseTime: 1500
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Testador de Prompts</h3>
                <p className="text-sm text-muted-foreground">
                  {agentName} • {selectedLLM.toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {messages.length} mensagens
              </Badge>
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">Teste seu agente</h4>
                <p className="text-muted-foreground">
                  Envie mensagens para testar como o agente responde
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <Clock className="h-3 w-3" />
                      {message.timestamp.toLocaleTimeString()}
                      {message.llm && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <Badge variant="secondary" className="text-xs">
                            {message.llm.toUpperCase()}
                          </Badge>
                        </>
                      )}
                      {message.responseTime && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {message.responseTime}ms
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-card/50">
          <div className="flex gap-2">
            <Textarea
              placeholder="Digite sua mensagem de teste..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[50px] max-h-32"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!currentMessage.trim() || isLoading}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      <div className="w-80 border-l bg-card/30">
        <div className="p-4 border-b">
          <h4 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Contexto de Teste
          </h4>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nome do Cliente
            </label>
            <Input
              value={testContext.customerName}
              onChange={(e) => setTestContext(prev => ({
                ...prev,
                customerName: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              WhatsApp
            </label>
            <Input
              value={testContext.whatsappNumber}
              onChange={(e) => setTestContext(prev => ({
                ...prev,
                whatsappNumber: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Conta de Energia (R$)
            </label>
            <Input
              value={testContext.energyBill}
              onChange={(e) => setTestContext(prev => ({
                ...prev,
                energyBill: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Tamanho do Telhado (m²)
            </label>
            <Input
              value={testContext.roofSize}
              onChange={(e) => setTestContext(prev => ({
                ...prev,
                roofSize: e.target.value
              }))}
            />
          </div>

          <Separator />

          <Button variant="outline" className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Aplicar Contexto
          </Button>
        </div>
      </div>
    </div>
  );
}