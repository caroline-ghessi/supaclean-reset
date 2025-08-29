-- Update Antônio César's token configured status
UPDATE vendors 
SET token_configured = true, updated_at = now()
WHERE id = '67775d50-932e-4758-a508-325d9bde7562';

-- Add RPC function to update vendor conversation stats
CREATE OR REPLACE FUNCTION update_vendor_conversation_stats(
  conversation_id_param BIGINT,
  from_me_param BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF from_me_param THEN
    UPDATE vendor_conversations 
    SET vendor_messages = vendor_messages + 1,
        total_messages = total_messages + 1,
        updated_at = now()
    WHERE id = conversation_id_param;
  ELSE
    UPDATE vendor_conversations 
    SET customer_messages = customer_messages + 1,
        total_messages = total_messages + 1,
        updated_at = now()
    WHERE id = conversation_id_param;
  END IF;
END;
$$;