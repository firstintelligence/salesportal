-- Create a junction table for agent-tenant access (supports multiple tenants per agent)
CREATE TABLE public.agent_tenant_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(agent_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.agent_tenant_access ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view agent tenant access (needed for tenant switching)
CREATE POLICY "Anyone can view agent tenant access"
ON public.agent_tenant_access FOR SELECT
USING (true);

-- Migrate existing agent-tenant relationships
INSERT INTO public.agent_tenant_access (agent_id, tenant_id)
SELECT agent_id, tenant_id 
FROM public.agent_profiles 
WHERE tenant_id IS NOT NULL
ON CONFLICT (agent_id, tenant_id) DO NOTHING;

-- Add Harry's access to George's Plumbing and Heating (he already has Reno Pros from migration)
INSERT INTO public.agent_tenant_access (agent_id, tenant_id)
SELECT 'HB6400', id FROM public.tenants WHERE slug = 'georges'
ON CONFLICT (agent_id, tenant_id) DO NOTHING;