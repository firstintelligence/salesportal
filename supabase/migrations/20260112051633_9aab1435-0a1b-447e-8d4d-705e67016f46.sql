-- Update the is_admin_agent function to use MM231611 instead of MM23
CREATE OR REPLACE FUNCTION public.is_admin_agent(agent_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT agent_id = 'MM231611';
$$;