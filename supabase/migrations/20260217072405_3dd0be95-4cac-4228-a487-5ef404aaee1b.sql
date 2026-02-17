
-- Table to track document deliveries to customers
CREATE TABLE public.document_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  agent_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  documents_sent TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert document deliveries"
ON public.document_deliveries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view document deliveries"
ON public.document_deliveries FOR SELECT
USING (true);

-- Table to store editable email templates (one per tenant or a global default)
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL DEFAULT 'document_delivery',
  subject TEXT NOT NULL DEFAULT 'Congratulations on Your Home Improvement Purchase - {{tenant_name}}',
  body_html TEXT NOT NULL DEFAULT '<p>Dear {{customer_name}},</p><p>Thank you for choosing {{tenant_name}}! Please find your documents attached below.</p><p>If you have any questions, please don''t hesitate to reach out.</p><p>Best regards,<br/>{{tenant_name}}</p>',
  from_email TEXT DEFAULT 'documents@docusend.ca',
  from_name TEXT DEFAULT '{{tenant_name}}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, template_type)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view email templates"
ON public.email_templates FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert email templates"
ON public.email_templates FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update email templates"
ON public.email_templates FOR UPDATE
USING (true);

-- Insert default global template (tenant_id = null)
INSERT INTO public.email_templates (tenant_id, template_type, subject, body_html, from_email, from_name)
VALUES (
  NULL,
  'document_delivery',
  'Congratulations on Your Home Improvement Purchase - {{tenant_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1e293b;">Hello {{customer_name}},</h2>
    <p style="color: #475569; line-height: 1.6;">Congratulations on your home improvement purchase! We''re excited to be working with you.</p>
    <p style="color: #475569; line-height: 1.6;">Please find your documents attached to this email for your records.</p>
    <p style="color: #475569; line-height: 1.6;">If you have any questions or need further assistance, please don''t hesitate to contact us.</p>
    <br/>
    <p style="color: #1e293b; font-weight: 600;">Best regards,</p>
    <p style="color: #1e293b; font-weight: 600;">{{tenant_name}}</p>
  </div>',
  'documents@docusend.ca',
  '{{tenant_name}}'
);
