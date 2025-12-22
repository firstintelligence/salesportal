-- Add document_url field to store the actual document
ALTER TABLE public.document_signatures
ADD COLUMN IF NOT EXISTS document_url text;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view documents (they need the URL)
CREATE POLICY "Documents are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents');

-- Allow inserting documents
CREATE POLICY "Allow uploading documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents');