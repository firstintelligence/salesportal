
-- Make tpv_request_id nullable on installation_checklists (no longer required)
ALTER TABLE public.installation_checklists ALTER COLUMN tpv_request_id DROP NOT NULL;

-- Add questionnaire_data column to store product-specific Q&A answers
ALTER TABLE public.installation_checklists ADD COLUMN IF NOT EXISTS questionnaire_data jsonb DEFAULT NULL;

-- Add product_type column to identify which product checklist this is for
ALTER TABLE public.installation_checklists ADD COLUMN IF NOT EXISTS product_type text DEFAULT NULL;

-- Create technicians table
CREATE TABLE public.technicians (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  name text NOT NULL,
  email text,
  phone text,
  specialty text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on technicians
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- RLS policies for technicians (viewable by all, managed by super admin)
CREATE POLICY "Anyone can view technicians"
ON public.technicians FOR SELECT USING (true);

CREATE POLICY "Anyone can insert technicians"
ON public.technicians FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update technicians"
ON public.technicians FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete technicians"
ON public.technicians FOR DELETE USING (true);

-- Add trigger for updated_at on technicians
CREATE TRIGGER update_technicians_updated_at
BEFORE UPDATE ON public.technicians
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
