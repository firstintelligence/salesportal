-- Add invoice_amount column to document_signatures to track actual signed amounts
ALTER TABLE public.document_signatures 
ADD COLUMN invoice_amount NUMERIC NULL;