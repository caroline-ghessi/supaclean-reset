import { Badge } from '@/components/ui/badge';

interface LogEntryProps {
  time: string;
  message: string;
  classified: string;
  confidence: number;
  status: string;
}

export function LogEntry({ time, message, classified, confidence, status }: LogEntryProps) {
  const isSuccess = status === 'success' && confidence >= 70;
  
  return (
    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
      <span className="text-xs text-muted-foreground font-mono min-w-[70px]">
        {time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          "{message}"
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge 
          variant={isSuccess ? "default" : "destructive"}
          className="text-xs"
        >
          {classified}
        </Badge>
        <span className={`text-xs font-medium min-w-[40px] text-right ${
          confidence >= 70 ? 'text-green-600' : 'text-orange-600'
        }`}>
          {confidence.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}