-- Configurar o BOT DE LEADS no sistema
INSERT INTO public.lead_bot_config (
  bot_name,
  whapi_token,
  phone_number,
  is_active
) VALUES (
  'BOT DE LEADS',
  'LEAD_BOT_WHAPI_TOKEN',
  '+5551881155622',
  true
)
ON CONFLICT (id) DO UPDATE SET
  bot_name = EXCLUDED.bot_name,
  whapi_token = EXCLUDED.whapi_token,
  phone_number = EXCLUDED.phone_number,
  updated_at = now();