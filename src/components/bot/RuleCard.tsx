import { Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface RuleCardProps {
  condition: string;
  action: string;
  active: boolean;
}

export function RuleCard({ condition, action, active }: RuleCardProps) {
  return (
    <div className="p-4 border border-border rounded-lg flex items-center justify-between hover:border-primary/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            SE
          </Badge>
          <p className="text-sm text-foreground">{condition}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            ENTÃO
          </Badge>
          <p className="text-sm text-foreground">{action}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch defaultChecked={active} />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit3 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}