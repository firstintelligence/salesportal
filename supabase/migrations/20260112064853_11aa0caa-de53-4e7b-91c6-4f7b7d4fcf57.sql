-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for ID scans/qualifications
CREATE TABLE public.id_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  id_number TEXT,
  id_expiry DATE,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  id_type TEXT DEFAULT 'Ontario Driver''s License',
  id_image_path TEXT,
  status TEXT DEFAULT 'approved',
  scanned_by TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.id_scans ENABLE ROW LEVEL SECURITY;

-- Create simple policies for id_scans (allow all operations for now since this is admin-only feature)
CREATE POLICY "Allow viewing ID scans"
ON public.id_scans FOR SELECT
USING (true);

CREATE POLICY "Allow inserting ID scans"
ON public.id_scans FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow updating ID scans"
ON public.id_scans FOR UPDATE
USING (true);

-- Add index for faster lookups
CREATE INDEX idx_id_scans_customer_id ON public.id_scans(customer_id);
CREATE INDEX idx_id_scans_id_number ON public.id_scans(id_number);
CREATE INDEX idx_id_scans_scanned_by ON public.id_scans(scanned_by);

-- Create trigger for updated_at
CREATE TRIGGER update_id_scans_updated_at
BEFORE UPDATE ON public.id_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();