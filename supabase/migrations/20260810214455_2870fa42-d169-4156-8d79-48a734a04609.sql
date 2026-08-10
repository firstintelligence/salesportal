INSERT INTO public.tenants (name, slug, address, phone, email)
VALUES ('Mythic Heating & Cooling', 'mythic', '9624 Lake Rd No. 44, Kettle and Stony Point First Nation, No. 44, ON N0N 1J1', '(519) 491-2619', 'cass@mythicappliances.ca')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, phone = EXCLUDED.phone, email = EXCLUDED.email;

INSERT INTO public.agent_tenant_access (agent_id, tenant_id)
SELECT a.agent_id, t.id
FROM (VALUES ('MM231611'), ('HB6400'), ('AA9097')) AS a(agent_id)
CROSS JOIN public.tenants t
WHERE t.slug = 'mythic'
ON CONFLICT DO NOTHING;