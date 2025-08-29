-- FASE 1: Remover token sensível e adicionar controle de configuração
ALTER TABLE public.vendors 
DROP COLUMN IF EXISTS whapi_token;

ALTER TABLE public.vendors 
ADD COLUMN token_configured boolean DEFAULT false NOT NULL;

-- Comentário sobre segurança
COMMENT ON COLUMN public.vendors.token_configured IS 'Indica se o token do vendedor foi configurado nos Supabase Secrets como VENDOR_TOKEN_{vendor_id}';

-- Atualizar registros existentes (assumir que precisam reconfigurar tokens)
UPDATE public.vendors 
SET token_configured = false;