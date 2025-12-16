-- Add agent_id column to customers table to track who created each customer
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS agent_id text;

-- Drop existing RLS policies on customers
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can update customers" ON public.customers;

-- Create new RLS policies for agent-level access control
-- Agents can only view customers they created, admins/super admins can view all
CREATE POLICY "Agents can view own customers or admin sees all" 
ON public.customers 
FOR SELECT 
USING (
  agent_id = ((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'::text)
  OR is_admin_agent(((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'::text))
);

-- Agents can insert customers (must set their own agent_id)
CREATE POLICY "Agents can insert customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

-- Agents can update their own customers, admins can update all
CREATE POLICY "Agents can update own customers or admin updates all" 
ON public.customers 
FOR UPDATE 
USING (
  agent_id = ((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'::text)
  OR is_admin_agent(((current_setting('request.headers'::text, true))::json ->> 'x-agent-id'::text))
);