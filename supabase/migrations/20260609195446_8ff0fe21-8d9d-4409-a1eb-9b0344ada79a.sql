DROP POLICY IF EXISTS "Agents can update customer-linked TPV requests" ON public.tpv_requests;
DROP POLICY IF EXISTS "Anyone can update TPV requests" ON public.tpv_requests;

CREATE OR REPLACE FUNCTION public.save_invoice_draft(
  p_customer_id uuid,
  p_tenant_id uuid,
  p_agent_id text,
  p_tpv_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_customer public.customers%ROWTYPE;
  target_tpv_id uuid;
BEGIN
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer id is required';
  END IF;

  IF p_agent_id IS NULL OR length(trim(p_agent_id)) = 0 THEN
    RAISE EXCEPTION 'Agent id is required';
  END IF;

  SELECT * INTO target_customer
  FROM public.customers
  WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF p_agent_id <> 'MM231611' THEN
    IF target_customer.agent_id IS DISTINCT FROM p_agent_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.get_subordinates(p_agent_id) subordinate
        WHERE subordinate.agent_id = target_customer.agent_id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.agent_tenant_access access
        WHERE access.agent_id = p_agent_id
          AND access.tenant_id = target_customer.tenant_id
      ) THEN
      RAISE EXCEPTION 'Agent cannot edit this customer';
    END IF;

    IF p_tenant_id IS NOT NULL AND target_customer.tenant_id IS DISTINCT FROM p_tenant_id THEN
      RAISE EXCEPTION 'Tenant mismatch';
    END IF;
  END IF;

  SELECT id INTO target_tpv_id
  FROM public.tpv_requests
  WHERE customer_id = p_customer_id
    AND status = 'draft'
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  IF target_tpv_id IS NULL THEN
    INSERT INTO public.tpv_requests (
      customer_id,
      tenant_id,
      agent_id,
      customer_name,
      first_name,
      last_name,
      customer_phone,
      customer_address,
      city,
      province,
      postal_code,
      email,
      products,
      sales_price,
      interest_rate,
      promotional_term,
      amortization,
      monthly_payment,
      status,
      items_json,
      updated_at
    ) VALUES (
      p_customer_id,
      p_tenant_id,
      p_agent_id,
      p_tpv_data->>'customer_name',
      p_tpv_data->>'first_name',
      p_tpv_data->>'last_name',
      COALESCE(NULLIF(p_tpv_data->>'customer_phone', ''), 'N/A'),
      COALESCE(NULLIF(p_tpv_data->>'customer_address', ''), 'N/A'),
      NULLIF(p_tpv_data->>'city', ''),
      NULLIF(p_tpv_data->>'province', ''),
      NULLIF(p_tpv_data->>'postal_code', ''),
      NULLIF(p_tpv_data->>'email', ''),
      p_tpv_data->>'products',
      p_tpv_data->>'sales_price',
      p_tpv_data->>'interest_rate',
      p_tpv_data->>'promotional_term',
      p_tpv_data->>'amortization',
      p_tpv_data->>'monthly_payment',
      COALESCE(NULLIF(p_tpv_data->>'status', ''), 'draft'),
      p_tpv_data->'items_json',
      now()
    )
    RETURNING id INTO target_tpv_id;
  ELSE
    UPDATE public.tpv_requests
    SET
      tenant_id = p_tenant_id,
      agent_id = p_agent_id,
      customer_name = p_tpv_data->>'customer_name',
      first_name = p_tpv_data->>'first_name',
      last_name = p_tpv_data->>'last_name',
      customer_phone = COALESCE(NULLIF(p_tpv_data->>'customer_phone', ''), customer_phone),
      customer_address = COALESCE(NULLIF(p_tpv_data->>'customer_address', ''), customer_address),
      city = NULLIF(p_tpv_data->>'city', ''),
      province = NULLIF(p_tpv_data->>'province', ''),
      postal_code = NULLIF(p_tpv_data->>'postal_code', ''),
      email = NULLIF(p_tpv_data->>'email', ''),
      products = p_tpv_data->>'products',
      sales_price = p_tpv_data->>'sales_price',
      interest_rate = p_tpv_data->>'interest_rate',
      promotional_term = p_tpv_data->>'promotional_term',
      amortization = p_tpv_data->>'amortization',
      monthly_payment = p_tpv_data->>'monthly_payment',
      status = COALESCE(NULLIF(p_tpv_data->>'status', ''), 'draft'),
      items_json = p_tpv_data->'items_json',
      updated_at = now()
    WHERE id = target_tpv_id;
  END IF;

  RETURN target_tpv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_invoice_draft(uuid, uuid, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.save_invoice_draft(uuid, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_invoice_draft(uuid, uuid, text, jsonb) TO service_role;