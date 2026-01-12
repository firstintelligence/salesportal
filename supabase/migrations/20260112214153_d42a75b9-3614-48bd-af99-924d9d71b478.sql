-- Create loan_applications table to store full loan application data
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  agent_id TEXT,
  
  -- Personal Details
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  birthdate TEXT,
  home_phone TEXT,
  mobile_phone TEXT,
  marital_status TEXT,
  email TEXT,
  sin TEXT,
  
  -- Housing
  address TEXT,
  unit_no TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  housing_status TEXT,
  years_at_address TEXT,
  monthly_housing_costs TEXT,
  
  -- Borrower ID
  photo_id_type TEXT,
  photo_id_province TEXT,
  photo_id_number TEXT,
  photo_id_expiry TEXT,
  
  -- Employment
  business_name TEXT,
  position_title TEXT,
  gross_monthly_income TEXT,
  employer_address TEXT,
  time_at_job TEXT,
  employment_status TEXT,
  employer_city TEXT,
  employer_province TEXT,
  
  -- Consents
  privacy_consent BOOLEAN DEFAULT FALSE,
  electronic_consent BOOLEAN DEFAULT FALSE,
  credit_consent BOOLEAN DEFAULT FALSE,
  signature_date TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for access
CREATE POLICY "Users can view loan applications" 
ON public.loan_applications 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create loan applications" 
ON public.loan_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update loan applications" 
ON public.loan_applications 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete loan applications" 
ON public.loan_applications 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loan_applications_updated_at
BEFORE UPDATE ON public.loan_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();