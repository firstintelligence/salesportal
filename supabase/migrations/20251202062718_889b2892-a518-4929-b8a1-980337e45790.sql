-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view customers"
ON public.customers
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update customers"
ON public.customers
FOR UPDATE
USING (true);

-- Add customer_id to tpv_requests
ALTER TABLE public.tpv_requests
ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- Add customer_id to installation_checklists
ALTER TABLE public.installation_checklists
ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_tpv_requests_updated_at();