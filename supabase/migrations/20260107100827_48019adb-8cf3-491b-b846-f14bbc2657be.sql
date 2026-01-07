-- Add items_json column to store full product configuration
ALTER TABLE public.tpv_requests 
ADD COLUMN items_json jsonb DEFAULT NULL;