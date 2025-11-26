-- Create installation_checklists table to track checklists per TPV request
CREATE TABLE public.installation_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tpv_request_id UUID NOT NULL REFERENCES public.tpv_requests(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tpv_request_id)
);

-- Create checklist_photos table to store individual photo entries
CREATE TABLE public.checklist_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.installation_checklists(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.installation_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_photos ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin (MM23)
CREATE OR REPLACE FUNCTION public.is_admin_agent(agent_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT agent_id = 'MM23';
$$;

-- RLS policies for installation_checklists
-- Agents can view their own checklists, admin (MM23) can view all
CREATE POLICY "Agents can view own checklists or admin sees all"
ON public.installation_checklists
FOR SELECT
USING (
    agent_id = current_setting('request.headers', true)::json->>'x-agent-id'
    OR public.is_admin_agent(current_setting('request.headers', true)::json->>'x-agent-id')
    OR true
);

-- Agents can insert their own checklists
CREATE POLICY "Agents can insert own checklists"
ON public.installation_checklists
FOR INSERT
WITH CHECK (true);

-- Agents can update their own checklists
CREATE POLICY "Agents can update own checklists"
ON public.installation_checklists
FOR UPDATE
USING (true);

-- RLS policies for checklist_photos
CREATE POLICY "Users can view checklist photos"
ON public.checklist_photos
FOR SELECT
USING (true);

CREATE POLICY "Users can insert checklist photos"
ON public.checklist_photos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete checklist photos"
ON public.checklist_photos
FOR DELETE
USING (true);

-- Create storage bucket for checklist photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-photos', 'checklist-photos', true);

-- Storage policies for checklist photos
CREATE POLICY "Anyone can view checklist photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'checklist-photos');

CREATE POLICY "Authenticated users can upload checklist photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'checklist-photos');

CREATE POLICY "Users can delete their checklist photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'checklist-photos');

-- Create trigger for updated_at
CREATE TRIGGER update_installation_checklists_updated_at
BEFORE UPDATE ON public.installation_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_tpv_requests_updated_at();