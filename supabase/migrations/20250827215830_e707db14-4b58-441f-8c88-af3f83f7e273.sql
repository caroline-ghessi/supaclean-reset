-- Inserir dados de teste para demonstrar o sistema

-- Inserir conversas de teste
INSERT INTO public.conversations (
  whatsapp_number,
  customer_name,
  customer_email,
  customer_city,
  customer_state,
  product_group,
  status,
  lead_temperature,
  lead_score,
  first_message_at,
  last_message_at
) VALUES 
  (
    '+5551999887766',
    'João Silva',
    'joao.silva@email.com',
    'Porto Alegre',
    'RS',
    'energia_solar',
    'active',
    'hot',
    85,
    now() - interval '2 hours',
    now() - interval '5 minutes'
  ),
  (
    '+5551998765432',
    'Maria Santos',
    'maria.santos@email.com',
    'Canoas',
    'RS',
    'telha_shingle',
    'waiting',
    'warm',
    60,
    now() - interval '1 day',
    now() - interval '30 minutes'
  ),
  (
    '+5551987654321',
    'Pedro Oliveira',
    null,
    'Gravataí',
    'RS',
    'steel_frame',
    'in_bot',
    'cold',
    25,
    now() - interval '3 hours',
    now() - interval '1 hour'
  ),
  (
    '+5551976543210',
    'Ana Costa',
    'ana.costa@email.com',
    'Novo Hamburgo',
    'RS',
    'drywall_divisorias',
    'with_agent',
    'hot',
    90,
    now() - interval '6 hours',
    now() - interval '15 minutes'
  );

-- Inserir mensagens de teste para cada conversa
-- Conversa 1: João Silva (Energia Solar)
INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'customer',
  'Olá! Gostaria de saber sobre energia solar para minha casa.',
  true,
  now() - interval '2 hours'
FROM conversations c 
WHERE c.whatsapp_number = '+5551999887766';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'bot',
  'Ótimo interesse em energia solar! Somos parceiros GE e temos as melhores soluções. Qual é o valor médio da sua conta de energia?',
  true,
  now() - interval '2 hours' + interval '1 minute'
FROM conversations c 
WHERE c.whatsapp_number = '+5551999887766';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'customer',
  'Minha conta vem em torno de R$ 350 por mês.',
  true,
  now() - interval '1 hour 30 minutes'
FROM conversations c 
WHERE c.whatsapp_number = '+5551999887766';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'agent',
  'Perfeito João! Com esse consumo, temos uma solução ideal. Posso agendar uma visita técnica gratuita?',
  false,
  now() - interval '5 minutes'
FROM conversations c 
WHERE c.whatsapp_number = '+5551999887766';

-- Conversa 2: Maria Santos (Telha Shingle)
INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'customer',
  'Preciso trocar o telhado da minha casa. Ouvi falar sobre telha shingle.',
  true,
  now() - interval '1 day'
FROM conversations c 
WHERE c.whatsapp_number = '+5551998765432';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'bot',
  'Excelente escolha! A telha shingle é moderna, durável e bonita. Qual é o tamanho aproximado do seu telhado?',
  true,
  now() - interval '1 day' + interval '2 minutes'
FROM conversations c 
WHERE c.whatsapp_number = '+5551998765432';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'customer',
  'A casa tem cerca de 120m². Gostaria de um orçamento.',
  false,
  now() - interval '30 minutes'
FROM conversations c 
WHERE c.whatsapp_number = '+5551998765432';

-- Conversa 3: Pedro Oliveira (Steel Frame)
INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'customer',
  'Estou construindo uma casa e pesquisando sobre steel frame.',
  true,
  now() - interval '3 hours'
FROM conversations c 
WHERE c.whatsapp_number = '+5551987654321';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'bot',
  'Steel frame é uma excelente opção! Construção rápida, econômica e sustentável. Você já tem o projeto arquitetônico?',
  true,
  now() - interval '3 hours' + interval '30 seconds'
FROM conversations c 
WHERE c.whatsapp_number = '+5551987654321';

-- Conversa 4: Ana Costa (Drywall)
INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'customer',
  'Preciso fazer divisórias em drywall no meu escritório.',
  true,
  now() - interval '6 hours'
FROM conversations c 
WHERE c.whatsapp_number = '+5551976543210';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'bot',
  'Perfeito! Drywall é ideal para escritórios. Rápido, limpo e versátil. Quantos metros quadrados de divisória você precisa?',
  true,
  now() - interval '6 hours' + interval '1 minute'
FROM conversations c 
WHERE c.whatsapp_number = '+5551976543210';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'customer',
  'Aproximadamente 30m² de divisórias. Quando podem vir fazer a medição?',
  true,
  now() - interval '5 hours'
FROM conversations c 
WHERE c.whatsapp_number = '+5551976543210';

INSERT INTO public.messages (
  conversation_id,
  sender_type,
  content,
  is_read,
  created_at
) 
SELECT 
  c.id,
  'agent',
  'Ótimo Ana! Vou transferir você para nossa equipe comercial que pode agendar a visita técnica hoje mesmo.',
  false,
  now() - interval '15 minutes'
FROM conversations c 
WHERE c.whatsapp_number = '+5551976543210';

-- Inserir contextos de projeto para algumas conversas
INSERT INTO public.project_contexts (
  conversation_id,
  energy_consumption,
  energy_bill_value,
  has_energy_backups,
  urgency,
  budget_range,
  notes
) 
SELECT 
  c.id,
  'alto',
  350.00,
  false,
  'medium',
  'R$ 20.000 - R$ 40.000',
  'Cliente demonstrou muito interesse, quer agendar visita técnica'
FROM conversations c 
WHERE c.whatsapp_number = '+5551999887766';

INSERT INTO public.project_contexts (
  conversation_id,
  roof_status,
  roof_size_m2,
  urgency,
  budget_range,
  notes
) 
SELECT 
  c.id,
  'reforma',
  120,
  'high',
  'R$ 15.000 - R$ 25.000',
  'Telhado antigo com problemas, precisa trocar urgente'
FROM conversations c 
WHERE c.whatsapp_number = '+5551998765432';

INSERT INTO public.project_contexts (
  conversation_id,
  has_architectural_project,
  construction_size_m2,
  urgency,
  timeline,
  notes
) 
SELECT 
  c.id,
  false,
  150,
  'low',
  '6-12 meses',
  'Ainda em fase de pesquisa, não tem pressa'
FROM conversations c 
WHERE c.whatsapp_number = '+5551987654321';

INSERT INTO public.project_contexts (
  conversation_id,
  floor_quantity_m2,
  floor_rooms,
  urgency,
  budget_range,
  notes
) 
SELECT 
  c.id,
  30,
  'Escritório comercial - 3 salas',
  'high',
  'R$ 5.000 - R$ 8.000',
  'Cliente empresarial, tem urgência para conclusão'
FROM conversations c 
WHERE c.whatsapp_number = '+5551976543210';