
-- Create agent hierarchy table
CREATE TABLE public.agent_hierarchy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  parent_agent_id TEXT,
  position_title TEXT DEFAULT 'Agent',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_hierarchy ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view agent hierarchy"
  ON public.agent_hierarchy FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert agent hierarchy"
  ON public.agent_hierarchy FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update agent hierarchy"
  ON public.agent_hierarchy FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete agent hierarchy"
  ON public.agent_hierarchy FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_agent_hierarchy_updated_at
  BEFORE UPDATE ON public.agent_hierarchy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Recursive function to get all subordinate agent_ids for a given agent
CREATE OR REPLACE FUNCTION public.get_subordinates(root_agent_id TEXT)
RETURNS TABLE(agent_id TEXT, depth INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE subordinates AS (
    -- Base case: direct reports
    SELECT ah.agent_id, 1 AS depth
    FROM agent_hierarchy ah
    WHERE ah.parent_agent_id = root_agent_id
    
    UNION ALL
    
    -- Recursive case: their reports
    SELECT ah.agent_id, s.depth + 1
    FROM agent_hierarchy ah
    INNER JOIN subordinates s ON ah.parent_agent_id = s.agent_id
  )
  SELECT * FROM subordinates;
$$;
