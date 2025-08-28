-- Create storage bucket for agent knowledge files
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-knowledge', 'agent-knowledge', false);

-- Create table for agent knowledge files
CREATE TABLE public.agent_knowledge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_category product_category NOT NULL,
  file_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path VARCHAR NOT NULL,
  extracted_content TEXT,
  metadata JSONB DEFAULT '{}',
  processing_status VARCHAR DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_knowledge_files ENABLE ROW LEVEL SECURITY;

-- Create policies for agent knowledge files
CREATE POLICY "Enable all for authenticated users" 
ON public.agent_knowledge_files 
FOR ALL 
USING (true);

-- Create storage policies for agent knowledge bucket
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'agent-knowledge' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'agent-knowledge' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'agent-knowledge' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'agent-knowledge' AND auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agent_knowledge_files_updated_at
BEFORE UPDATE ON public.agent_knowledge_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();