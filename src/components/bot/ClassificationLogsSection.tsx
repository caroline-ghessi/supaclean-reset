import { Clock } from 'lucide-react';
import { LogEntry } from './LogEntry';
import { useClassificationLogs } from '@/hooks/useClassificationLogs';

export function ClassificationLogsSection() {
  const { data: logs = [] } = useClassificationLogs(10);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">
          Logs de Classificação em Tempo Real
        </h3>
      </div>
      
      <div className="bg-background rounded-xl shadow-sm border border-border p-4">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log) => (
              <LogEntry
                key={log.id}
                time={new Date(log.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
                message={log.message_text}
                classified={log.classified_category || 'Não classificado'}
                confidence={log.confidence_score || 0}
                status={log.status}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum log de classificação disponível</p>
              <p className="text-sm">Os logs aparecerão aqui conforme as mensagens forem processadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}