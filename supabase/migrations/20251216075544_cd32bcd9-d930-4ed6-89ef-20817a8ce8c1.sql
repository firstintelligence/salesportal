-- Add DELETE policy for customers table
CREATE POLICY "Users can delete customers" 
ON public.customers 
FOR DELETE 
USING (true);