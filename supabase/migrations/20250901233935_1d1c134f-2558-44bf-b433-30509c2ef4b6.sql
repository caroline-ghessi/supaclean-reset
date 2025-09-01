-- Adicionar foreign keys para permitir queries nested entre lead_distributions, conversations e vendors
-- Primeiro, vamos verificar se há dados inconsistentes que podem impedir a criação das foreign keys

-- Adicionar foreign key entre lead_distributions.conversation_id e conversations.id
ALTER TABLE public.lead_distributions 
ADD CONSTRAINT fk_lead_distributions_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) 
ON DELETE CASCADE;

-- Adicionar foreign key entre lead_distributions.vendor_id e vendors.id  
ALTER TABLE public.lead_distributions 
ADD CONSTRAINT fk_lead_distributions_vendor_id 
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) 
ON DELETE CASCADE;

-- Adicionar índices para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_lead_distributions_conversation_id 
ON public.lead_distributions(conversation_id);

CREATE INDEX IF NOT EXISTS idx_lead_distributions_vendor_id 
ON public.lead_distributions(vendor_id);

-- Comentário para documentar a mudança
COMMENT ON CONSTRAINT fk_lead_distributions_conversation_id ON public.lead_distributions 
IS 'Foreign key to ensure data integrity between lead distributions and conversations';

COMMENT ON CONSTRAINT fk_lead_distributions_vendor_id ON public.lead_distributions 
IS 'Foreign key to ensure data integrity between lead distributions and vendors';