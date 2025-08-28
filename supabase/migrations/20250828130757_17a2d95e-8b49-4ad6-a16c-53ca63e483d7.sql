-- Drop existing problematic RLS policies for agent-knowledge bucket
DROP POLICY IF EXISTS "Authenticated users can upload agent knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view agent knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update agent knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete agent knowledge files" ON storage.objects;

-- Create new RLS policies using auth.uid() IS NOT NULL (following whatsapp-media pattern)
CREATE POLICY "Users can upload to agent-knowledge bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'agent-knowledge' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view agent-knowledge files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'agent-knowledge' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update agent-knowledge files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'agent-knowledge' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete agent-knowledge files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'agent-knowledge' AND auth.uid() IS NOT NULL);