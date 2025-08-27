import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ConversationsHeader() {
  return (
    <div className="bg-chat-header border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-foreground">WhatsApp Business</h1>
          <p className="text-xs text-muted-foreground">Drystore</p>
        </div>
      </div>
      
      <Button variant="ghost" size="sm" className="p-2">
        <MoreVertical size={18} />
      </Button>
    </div>
  );
}