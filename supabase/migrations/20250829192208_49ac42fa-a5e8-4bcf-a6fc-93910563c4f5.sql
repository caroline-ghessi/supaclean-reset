-- Corrigir nome do cliente na conversa existente
UPDATE vendor_conversations 
SET customer_name = 'Cristiano Machado' 
WHERE customer_phone = '555192577550' 
AND vendor_id = '67775d50-932e-4758-a508-325d9bde7562';