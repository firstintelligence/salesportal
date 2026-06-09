DROP POLICY IF EXISTS "Anyone can update TPV requests" ON public.tpv_requests;

CREATE POLICY "Agents can update customer-linked TPV requests"
ON public.tpv_requests
FOR UPDATE
TO anon, authenticated
USING (customer_id IS NOT NULL AND agent_id IS NOT NULL)
WITH CHECK (customer_id IS NOT NULL AND agent_id IS NOT NULL);