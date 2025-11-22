-- Create tpv_requests table to log all TPV verification calls
CREATE TABLE IF NOT EXISTS public.tpv_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  email TEXT,
  products TEXT,
  sales_price TEXT,
  interest_rate TEXT,
  promotional_term TEXT,
  amortization TEXT,
  monthly_payment TEXT,
  vapi_call_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  ended_reason TEXT,
  call_duration_seconds INTEGER,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tpv_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tpv_requests_agent_id ON public.tpv_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_tpv_requests_created_at ON public.tpv_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tpv_requests_vapi_call_id ON public.tpv_requests(vapi_call_id);

-- Create function to update timestamps with proper security
CREATE OR REPLACE FUNCTION public.update_tpv_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_tpv_requests_updated_at ON public.tpv_requests;
CREATE TRIGGER update_tpv_requests_updated_at
BEFORE UPDATE ON public.tpv_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_tpv_requests_updated_at();

-- Add comments for clarity
COMMENT ON COLUMN public.tpv_requests.first_name IS 'Customer first name';
COMMENT ON COLUMN public.tpv_requests.last_name IS 'Customer last name';
COMMENT ON COLUMN public.tpv_requests.customer_name IS 'Full customer name (first + last)';