-- Create document_signatures table to store signing location data
CREATE TABLE public.document_signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Document reference (can link to various document types)
  document_type text NOT NULL, -- 'invoice', 'loan_application', 'tpv_request', 'receipt', etc.
  document_id uuid NOT NULL,
  
  -- Customer reference
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  
  -- Agent who facilitated the signing
  agent_id text NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  
  -- Signing location data
  ip_address text,
  latitude numeric,
  longitude numeric,
  city text,
  region text,
  country text,
  postal_code text,
  timezone text,
  isp text,
  
  -- Formatted location string
  location_string text,
  
  -- Additional metadata
  user_agent text,
  signature_type text, -- 'customer', 'co_applicant', 'agent', etc.
  signed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

-- Only admins can view document signatures (using the is_admin_agent function)
CREATE POLICY "Only admins can view document signatures"
ON public.document_signatures
FOR SELECT
USING (
  is_admin_agent(
    ((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'::text)
  )
);

-- Allow inserts from authenticated sources (edge functions, etc.)
CREATE POLICY "Allow inserting document signatures"
ON public.document_signatures
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_document_signatures_customer_id ON public.document_signatures(customer_id);
CREATE INDEX idx_document_signatures_document_id ON public.document_signatures(document_id);
CREATE INDEX idx_document_signatures_created_at ON public.document_signatures(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.document_signatures IS 'Stores document signing locations for audit and compliance purposes. Only accessible by admin agents.';