
-- Drop the old restrictive SELECT policy on id_scans
DROP POLICY IF EXISTS "Users can view own ID scans or admin sees all" ON public.id_scans;

-- Create a simpler SELECT policy matching other tables (app-level tenant filtering handles access control)
CREATE POLICY "Users can view id scans" ON public.id_scans
FOR SELECT USING (true);

-- Also simplify INSERT and UPDATE to not rely on x-agent-id headers
DROP POLICY IF EXISTS "Users can insert own ID scans" ON public.id_scans;
CREATE POLICY "Users can insert id scans" ON public.id_scans
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own ID scans" ON public.id_scans;
CREATE POLICY "Users can update id scans" ON public.id_scans
FOR UPDATE USING (true);
