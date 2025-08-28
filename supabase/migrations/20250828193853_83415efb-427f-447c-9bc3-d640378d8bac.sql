-- Ensure whatsapp-media bucket exists and has proper policies
DO $$
BEGIN
  -- Insert bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('whatsapp-media', 'whatsapp-media', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create policies for whatsapp-media bucket
CREATE POLICY "Anyone can view whatsapp media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated users can upload whatsapp media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated users can update whatsapp media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated users can delete whatsapp media"
ON storage.objects FOR DELETE
USING (bucket_id = 'whatsapp-media');