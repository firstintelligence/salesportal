-- Create SIA Heating and Cooling tenant
INSERT INTO public.tenants (name, slug, address, phone, email)
VALUES ('SIA Heating and Cooling', 'sia', '102 Oak Ave, Richmond Hill, ON L4C 6R7', '(647) 482-3654', null);

-- Grant access to listed agents (Radi, Chady, Harry, Don AA, both Zsolts, super admin MM231611)
INSERT INTO public.agent_tenant_access (agent_id, tenant_id)
SELECT unnest(ARRAY['AR4777','CH5149','HB6400','AA9097','ZD4590','ZD7539','MM231611']) AS agent_id,
       (SELECT id FROM public.tenants WHERE slug = 'sia');