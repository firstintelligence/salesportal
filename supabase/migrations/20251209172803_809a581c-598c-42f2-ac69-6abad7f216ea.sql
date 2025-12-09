-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenants (anyone can view for now)
CREATE POLICY "Anyone can view tenants" ON public.tenants FOR SELECT USING (true);

-- Create agent_profiles table to store agent info with tenant association
CREATE TABLE public.agent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on agent_profiles
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent_profiles
CREATE POLICY "Anyone can view agent profiles" ON public.agent_profiles FOR SELECT USING (true);

-- Add tenant_id to customers table
ALTER TABLE public.customers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

-- Add tenant_id to tpv_requests table
ALTER TABLE public.tpv_requests ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

-- Insert tenants
INSERT INTO public.tenants (name, slug, address, phone, email) VALUES
  ('George''s Plumbing & Heating', 'georges', '123 Main Street, Toronto, ON', '+1 (905) 904-3544', 'info@georgesplumbing.ca'),
  ('Polaron Comfort', 'polaron', '2 Tippett Rd Floor 4, North York, ON M3H 2V2', '+1 888-318-1988', 'info@polaronsolar.com'),
  ('Maher Heating & Cooling', 'maher', NULL, NULL, NULL),
  ('Crown Construction', 'crown', NULL, NULL, NULL),
  ('Marathon Electric', 'marathon', '1200 Bay Street, Toronto, ON M5W 2A9', '+1 (647) 794-1199', 'info@marathon-electric.ca');

-- Insert agent profiles for George's Plumbing & Heating
INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone, is_super_admin)
SELECT 'MM23', id, 'MoMo', NULL, '+1 (905) 904-3544', true FROM public.tenants WHERE slug = 'georges';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'TB0195', id, 'Tadeo', NULL, '+1 (416) 875-0195' FROM public.tenants WHERE slug = 'georges';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'AA9097', id, 'Donny', NULL, '+1 (647) 716-9097' FROM public.tenants WHERE slug = 'georges';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'HB6400', id, 'Harry', NULL, '+1 (647) 377-6400' FROM public.tenants WHERE slug = 'georges';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'TP5142', id, 'Tony', NULL, '+1 (647) 549-5142' FROM public.tenants WHERE slug = 'georges';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'BB2704', id, 'Bonnie', NULL, '+1 (519) 282-2704' FROM public.tenants WHERE slug = 'georges';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'AB5394', id, 'Abe', NULL, '+1 (613) 263-5394' FROM public.tenants WHERE slug = 'georges';

-- Insert agent profiles for Polaron
INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'CI11', id, 'Chris', 'Infantry', NULL FROM public.tenants WHERE slug = 'polaron';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'LA11', id, 'Levi', 'Ajodha', NULL FROM public.tenants WHERE slug = 'polaron';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'AW11', id, 'Ann', 'Wheeler', NULL FROM public.tenants WHERE slug = 'polaron';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'MA11', id, 'Mohamed', 'AbdelAziz', NULL FROM public.tenants WHERE slug = 'polaron';

INSERT INTO public.agent_profiles (agent_id, tenant_id, first_name, last_name, phone)
SELECT 'MW11', id, 'Mohan', 'Wang', NULL FROM public.tenants WHERE slug = 'polaron';