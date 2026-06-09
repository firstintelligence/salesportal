DROP POLICY IF EXISTS "Anyone can update TPV requests" ON public.tpv_requests;

CREATE POLICY "Anyone can update TPV requests"
ON public.tpv_requests
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);