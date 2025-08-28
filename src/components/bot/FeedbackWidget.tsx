import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeFeedback } from '@/hooks/useRAGSystem';

interface FeedbackWidgetProps {
  knowledgeEntryId: string;
  conversationId?: string;
  messageId?: string;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackWidget({ 
  knowledgeEntryId, 
  conversationId, 
  messageId, 
  onFeedbackSubmitted 
}: FeedbackWidgetProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'helpful' | 'not_helpful' | 'incorrect' | 'outdated' | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  
  const submitFeedback = useKnowledgeFeedback();

  const handleQuickFeedback = (type: 'helpful' | 'not_helpful') => {
    submitFeedback.mutate({
      knowledge_entry_id: knowledgeEntryId,
      conversation_id: conversationId,
      message_id: messageId,
      feedback_type: type,
      rating: type === 'helpful' ? 5 : 2
    });
    
    onFeedbackSubmitted?.();
  };

  const handleDetailedFeedback = () => {
    if (!feedbackType) return;
    
    submitFeedback.mutate({
      knowledge_entry_id: knowledgeEntryId,
      conversation_id: conversationId,
      message_id: messageId,
      feedback_type: feedbackType,
      rating,
      feedback_text: feedbackText.trim() || undefined
    });
    
    setShowFeedbackForm(false);
    setFeedbackType(null);
    setRating(0);
    setFeedbackText('');
    onFeedbackSubmitted?.();
  };

  if (submitFeedback.isSuccess) {
    return (
      <Card className="p-3 bg-green-50 border-green-200">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 text-green-700">
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm">Obrigado pelo seu feedback!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showFeedbackForm) {
    return (
      <Card className="p-4">
        <CardContent className="p-0 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Como foi a qualidade desta resposta?</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={feedbackType === 'helpful' ? 'default' : 'outline'}
                onClick={() => setFeedbackType('helpful')}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Útil
              </Button>
              <Button
                size="sm"
                variant={feedbackType === 'not_helpful' ? 'default' : 'outline'}
                onClick={() => setFeedbackType('not_helpful')}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                Não útil
              </Button>
              <Button
                size="sm"
                variant={feedbackType === 'incorrect' ? 'default' : 'outline'}
                onClick={() => setFeedbackType('incorrect')}
              >
                Incorreta
              </Button>
              <Button
                size="sm"
                variant={feedbackType === 'outdated' ? 'default' : 'outline'}
                onClick={() => setFeedbackType('outdated')}
              >
                Desatualizada
              </Button>
            </div>
          </div>

          {feedbackType && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Avaliação (1-5 estrelas)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-6 h-6 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Comentários adicionais (opcional)
                </label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Como podemos melhorar esta resposta?"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleDetailedFeedback}
                  disabled={!feedbackType || rating === 0 || submitFeedback.isPending}
                >
                  {submitFeedback.isPending ? 'Enviando...' : 'Enviar Feedback'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFeedbackForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="text-xs text-muted-foreground">Esta resposta foi útil?</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleQuickFeedback('helpful')}
        disabled={submitFeedback.isPending}
      >
        <ThumbsUp className="w-3 h-3 mr-1" />
        Sim
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleQuickFeedback('not_helpful')}
        disabled={submitFeedback.isPending}
      >
        <ThumbsDown className="w-3 h-3 mr-1" />
        Não
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowFeedbackForm(true)}
      >
        <MessageSquare className="w-3 h-3 mr-1" />
        Detalhar
      </Button>
    </div>
  );
}