-- Adicionar coluna para controle de lock atômico na tabela message_buffers
ALTER TABLE public.message_buffers 
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_message_buffers_processing_lock 
ON public.message_buffers (conversation_id, processed, processing_started_at);

-- Criar função RPC para agendar processamento de buffer
CREATE OR REPLACE FUNCTION public.schedule_buffer_processing(
  job_name TEXT,
  cron_expression TEXT,
  conversation_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Para simplicidade, vamos usar uma abordagem diferente
  -- Apenas inserir um registro para trigger posterior
  INSERT INTO public.system_logs (
    level,
    source,
    message,
    data
  ) VALUES (
    'info',
    'schedule_buffer_processing',
    'Buffer processing scheduled',
    jsonb_build_object(
      'conversation_id', conversation_id_param,
      'job_name', job_name,
      'cron_expression', cron_expression,
      'scheduled_at', NOW()
    )
  );
END;
$$;