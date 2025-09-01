-- Adicionar coluna llm_model na tabela agent_configs se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configs' 
        AND column_name = 'llm_model'
    ) THEN
        ALTER TABLE public.agent_configs 
        ADD COLUMN llm_model character varying DEFAULT 'claude-3-5-sonnet-20241022'::character varying;
    END IF;
END $$;