-- Drop existing RLS policies on id_scans
DROP POLICY IF EXISTS "Allow inserting ID scans" ON public.id_scans;
DROP POLICY IF EXISTS "Allow updating ID scans" ON public.id_scans;
DROP POLICY IF EXISTS "Allow viewing ID scans" ON public.id_scans;

-- Create new RLS policies for id_scans
-- Users can only view their own scans (by scanned_by), super admin can see all
CREATE POLICY "Users can view own ID scans or admin sees all"
ON public.id_scans
FOR SELECT
USING (
  scanned_by = ((current_setting('request.headers'::text, true))::json ->> 'x-agent-id')
  OR is_admin_agent(((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'))
);

-- Users can insert their own scans
CREATE POLICY "Users can insert own ID scans"
ON public.id_scans
FOR INSERT
WITH CHECK (
  scanned_by = ((current_setting('request.headers'::text, true))::json ->> 'x-agent-id')
  OR is_admin_agent(((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'))
);

-- Users can update their own scans
CREATE POLICY "Users can update own ID scans"
ON public.id_scans
FOR UPDATE
USING (
  scanned_by = ((current_setting('request.headers'::text, true))::json ->> 'x-agent-id')
  OR is_admin_agent(((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'))
);