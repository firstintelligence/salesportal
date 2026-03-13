
-- Add is_contractor flag to agent_profiles
ALTER TABLE agent_profiles ADD COLUMN is_contractor boolean DEFAULT false;

-- Create job_dispatches table
CREATE TABLE job_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id),
  contractor_agent_id text NOT NULL,
  dispatched_by text NOT NULL,
  status text NOT NULL DEFAULT 'dispatched',
  notes text,
  products text,
  dispatched_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE job_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job dispatches" ON job_dispatches FOR SELECT USING (true);
CREATE POLICY "Anyone can insert job dispatches" ON job_dispatches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job dispatches" ON job_dispatches FOR UPDATE USING (true);

-- Create dispatch_photos table for contractor uploaded photos
CREATE TABLE dispatch_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id uuid REFERENCES job_dispatches(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  uploaded_by text NOT NULL,
  photo_url text NOT NULL,
  ai_label text,
  category text,
  photo_type text NOT NULL DEFAULT 'completion',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE dispatch_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dispatch photos" ON dispatch_photos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert dispatch photos" ON dispatch_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete dispatch photos" ON dispatch_photos FOR DELETE USING (true);
