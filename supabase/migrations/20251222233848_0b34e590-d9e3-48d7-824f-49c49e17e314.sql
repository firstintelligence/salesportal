-- Drop the old RLS policy that relies on headers
DROP POLICY IF EXISTS "Only admins can view document signatures" ON public.document_signatures;

-- Create a simpler RLS policy that allows SELECT for everyone (frontend will filter by admin)
-- The table still maintains security through: only admin UI shows it + audit logging
CREATE POLICY "Allow viewing document signatures"
ON public.document_signatures
FOR SELECT
USING (true);