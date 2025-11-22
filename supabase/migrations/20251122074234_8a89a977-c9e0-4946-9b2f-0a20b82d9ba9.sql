-- Add RLS policies for tpv_requests table
-- Note: Edge functions use service_role which bypasses RLS
-- These policies are for potential future frontend access

-- Allow service role full access (this is implicit but we add it for clarity)
CREATE POLICY "Service role has full access to tpv_requests"
ON public.tpv_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow anon users to insert TPV requests (for form submissions)
CREATE POLICY "Anyone can insert TPV requests"
ON public.tpv_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to view TPV requests
CREATE POLICY "Anyone can view TPV requests"
ON public.tpv_requests
FOR SELECT
TO anon
USING (true);