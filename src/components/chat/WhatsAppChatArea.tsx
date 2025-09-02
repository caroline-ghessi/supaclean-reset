import { useState, useRef, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, MoreVertical, Paperclip, Smile, Send, Mic, ArrowDown, UserCheck, Bot, FileText, Archive } from 'lucide-react';
import { useConversation } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useCreateMessage } from '@/hooks/useMessages';
import { useRealtimeMessages } from '@/hooks/useRealtimeSubscription';
import { useAssumeConversation, useReturnConversationToBot, useCloseConversation } from '@/hooks/useConversationActions';
import { useGenerateLeadSummary, useSendLeadToVendor, useVendors } from '@/hooks/useLeadSummary';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WhatsAppMessageBubble } from './WhatsAppMessageBubble';
import { LeadSummaryModal } from './LeadSummaryModal';
import { CloseConversationDialog } from './CloseConversationDialog';

interface WhatsAppChatAreaProps {
  conversationId: string;
}

export function WhatsAppChatArea({ conversationId }: WhatsAppChatAreaProps) {
  const [messageText, setMessageText] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDisplayName = (conversation: any) => {
    return conversation?.customer_name || conversation?.whatsapp_name || 'Usuário';
  };

  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { data: messages, isLoading: messagesLoading } = useMessages(conversationId);
  const createMessage = useCreateMessage();
  const assumeConversation = useAssumeConversation();
  const returnToBot = useReturnConversationToBot();
  const closeConversation = useCloseConversation();

  // Lead summary hooks
  const generateSummary = useGenerateLeadSummary();
  const sendToVendor = useSendLeadToVendor();
  const { data: vendors } = useVendors();

  // Enable realtime updates
  useRealtimeMessages(conversationId);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText('');

    try {
      await createMessage.mutateAsync({
        conversation_id: conversationId,
        content,
        sender_type: 'agent',
        sender_name: 'Agente',
        is_read: true,
        metadata: {}
      });
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle summary generation
  const handleGenerateSummary = async () => {
    try {
      const data = await generateSummary.mutateAsync(conversationId);
      setSummaryData(data);
      setShowSummaryModal(true);
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    }
  };

  // Handle send to vendor
  const handleSendToVendor = async (vendorId: string, editedSummary: string) => {
    try {
      await sendToVendor.mutateAsync({
        conversationId,
        vendorId,
        summary: editedSummary,
        sentByAgentId: undefined // TODO: Get current user ID
      });
      setShowSummaryModal(false);
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  // Handle close conversation
  const handleCloseConversation = async (reason: string) => {
    try {
      await closeConversation.mutateAsync({
        conversationId,
        reason
      });
      setShowCloseDialog(false);
    } catch (error) {
      console.error('Erro ao finalizar conversa:', error);
    }
  };

  const getProductIcon = (productGroup: string) => {
    const icons = {
      energia_solar: '☀️',
      telha_shingle: '🏠',
      steel_frame: '🏗️',
      drywall_divisorias: '🧱',
      ferramentas: '🔧',
      pisos: '🏁',
      acabamentos: '🎨',
      forros: '📐'
    };
    return icons[productGroup as keyof typeof icons] || '📦';
  };

  const getTemperatureColor = (temperature: string) => {
    const colors = {
      hot: 'bg-red-100 text-red-700 border-red-300',
      warm: 'bg-orange-100 text-orange-700 border-orange-300',
      cold: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return colors[temperature as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (conversationLoading) {
    return (
      <div className="flex-1 flex flex-col bg-chat-background">
        <div className="bg-chat-header px-4 py-3 border-b border-border">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-background">
        <div className="text-center">
          <p className="text-muted-foreground">Conversa não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-background overflow-hidden">
      {/* Header */}
      <div className="bg-chat-header px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={`https://ui-avatars.com/api/?name=${getDisplayName(conversation)}&background=F97316&color=fff`}
              alt={getDisplayName(conversation)}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getDisplayName(conversation).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{getDisplayName(conversation)}</h3>
            <p className="text-xs text-muted-foreground">
              {conversation.whatsapp_number ? `+${conversation.whatsapp_number}` : 'WhatsApp'}
            </p>
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2">
            {conversation.product_group && (
              <Badge variant="outline" className="text-xs">
                {getProductIcon(conversation.product_group)} {conversation.product_group.replace('_', ' ')}
              </Badge>
            )}
            
            {conversation.lead_temperature && (
              <Badge 
                variant="outline" 
                className={`text-xs border ${getTemperatureColor(conversation.lead_temperature)}`}
              >
                {conversation.lead_temperature === 'hot' && '🔥 Quente'}
                {conversation.lead_temperature === 'warm' && '🌡️ Morno'}
                {conversation.lead_temperature === 'cold' && '❄️ Frio'}
                {conversation.lead_score && ` ${conversation.lead_score}%`}
              </Badge>
            )}
            
            {/* Status Badge */}
            <Badge 
              variant={conversation.status === 'with_agent' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {conversation.status === 'with_agent' ? '👤 Com Agente' : '🤖 Com Bot'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Lead Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={generateSummary.isPending}
            className="flex items-center gap-2 text-xs px-2"
          >
            <FileText className="h-4 w-4" />
            {generateSummary.isPending ? 'Gerando...' : 'Gerar Resumo'}
          </Button>

          {/* Conversation Control Buttons */}
          {conversation.status === 'in_bot' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => assumeConversation.mutate(conversationId)}
              disabled={assumeConversation.isPending}
              className="text-xs px-2"
            >
              <UserCheck size={14} className="mr-1" />
              Assumir
            </Button>
          )}
          
          {conversation.status === 'with_agent' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => returnToBot.mutate(conversationId)}
              disabled={returnToBot.isPending}
              className="text-xs px-2"
            >
              <Bot size={14} className="mr-1" />
              Devolver
            </Button>
          )}

          {/* Close Conversation Button - Only show for active conversations */}
          {(conversation.status === 'in_bot' || conversation.status === 'with_agent') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCloseDialog(true)}
              disabled={closeConversation.isPending}
              className="text-xs px-2 text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
            >
              <Archive size={14} className="mr-1" />
              Finalizar
            </Button>
          )}
          
          <Button variant="ghost" size="sm">
            <Search size={18} />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onScroll={handleScroll}
      >
        {messagesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-16 w-64 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Inicie uma conversa enviando uma mensagem</p>
            </div>
          </div>
        ) : (
          <>
            {/* Date Separator */}
            <div className="flex justify-center my-4">
              <Badge variant="secondary" className="bg-background/80 text-xs">
                Hoje
              </Badge>
            </div>

            {messages?.map((message) => (
              <WhatsAppMessageBubble key={message.id} message={message} />
            ))}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 rounded-full w-10 h-10 p-0 shadow-lg"
          variant="secondary"
        >
          <ArrowDown size={16} />
        </Button>
      )}

      {/* Input Area */}
      <div className="bg-chat-header px-4 py-3 border-t border-border">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <Smile size={20} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </Button>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={(e) => console.log('File selected:', e.target.files?.[0])}
          />

          <div className="flex-1 relative">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              className="min-h-[40px] max-h-[120px] resize-none bg-background border-input rounded-lg pr-12"
              rows={1}
            />
          </div>

          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim() || createMessage.isPending}
            className="flex-shrink-0 rounded-full w-10 h-10 p-0"
          >
            {messageText.trim() ? <Send size={16} /> : <Mic size={16} />}
          </Button>
        </div>
      </div>

      {/* Lead Summary Modal */}
      <LeadSummaryModal
        open={showSummaryModal}
        onOpenChange={setShowSummaryModal}
        summaryData={summaryData}
        vendors={vendors || []}
        onSendToVendor={handleSendToVendor}
        sending={sendToVendor.isPending}
      />

      {/* Close Conversation Dialog */}
      <CloseConversationDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onConfirm={handleCloseConversation}
        isLoading={closeConversation.isPending}
      />
    </div>
  );
}