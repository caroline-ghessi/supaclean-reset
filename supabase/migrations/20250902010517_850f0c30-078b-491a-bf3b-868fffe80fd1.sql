-- Add transcription fields to messages table
ALTER TABLE public.messages 
ADD COLUMN transcription TEXT,
ADD COLUMN transcription_status VARCHAR(20) DEFAULT 'not_applicable';