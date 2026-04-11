import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const normalizeNorthAmericanPhone = (phoneInput: unknown) => {
  const digitsOnly = String(phoneInput ?? '').replace(/\D/g, '');

  // Accept 10-digit local format, or 11-digit format that already includes country code "1"
  const localDigits =
    digitsOnly.length === 11 && digitsOnly.startsWith('1')
      ? digitsOnly.slice(1)
      : digitsOnly;

  if (localDigits.length !== 10) {
    throw new Error('Invalid customer phone number. Please enter a valid 10-digit number.');
  }

  return {
    localDigits,
    e164: `+1${localDigits}`,
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
    if (!VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY is not configured');
    }

    const formData = await req.json();
    console.log('Received TPV request:', formData);

    // Validate agent ID
    const VALID_AGENTS: Record<string, string> = {
      // George's agents
      'MM231611': '+19059043544', // MoMo - Super Admin
      'WK8448': '+16476258448',
      'TB0195': '+14168750195',
      'AA9097': '+16477169097',
      'HB6400': '+16473776400',
      'NH8397': '+19053248397', // Nick Henry - Reno Pros & George's
      'CH5149': '+10000000000', // Chady
      // Polaron agents
      'CI11': '+10000000001',
      'LA11': '+10000000002',
      'AW11': '+10000000003',
      'MA11': '+19059043544',
      'MW11': '+10000000005',
      'WLead6': '+14168398267',
      // Energy Experts agents
      'WA4929': '+16479234929',
      'AK47': '+14379875094',
      'YG23': '+10000000007',
      'AR4777': '+14165944777', // Radi
      'PN2182': '+16474252182', // Phil
      'ZD4590': '+14168564590', // Zsolt
      'ZD7539': '+17802377539', // Zsolt
      'GS8773': '+15194948773', // Gabe
      'SS7326': '+14168367326', // Sean
      'SH8662': '+18196648662', // Saleem Haqani - Reno Pros, George's, Provincial
      'SF8235': '+16478198235', // Shaquille Forrester - Reno Pros
      'MS8487': '+16472978487', // Mustafa Saighani - Reno Pros
    };

    if (!VALID_AGENTS[formData.agentId]) {
      throw new Error('Invalid agent ID');
    }

    // Tenant-specific VAPI assistant IDs
    const TENANT_VAPI_ASSISTANTS: Record<string, string> = {
      'georges': '33a8b0b6-2fc0-4f1f-9f01-02712d52a676',
      'polaron': '1599d49b-3aca-43a7-8bec-ad4faac11913',
      'energyexperts': '89ff92a2-dde7-4902-ae15-a93f22e49e9f',
    };

    // Get the VAPI assistant ID based on tenant slug (default to georges)
    const tenantSlug = formData.tenantSlug || 'georges';
    const assistantId = TENANT_VAPI_ASSISTANTS[tenantSlug] || TENANT_VAPI_ASSISTANTS['georges'];
    console.log('Using VAPI assistant ID for tenant:', tenantSlug, assistantId);

    // Normalize customer phone to prevent invalid +11... formatting
    const { localDigits: cleanPhone, e164: formattedPhone } = normalizeNorthAmericanPhone(formData.phoneNumber);
    console.log('Formatted phone for VAPI:', formattedPhone);

    // Prepare the VAPI call request with all form fields as dynamic variables
    const vapiCallRequest: any = {
      phoneNumberId: 'f87b72fe-4a8a-401e-8445-6f5e159cfcc1', // VAPI phone number to call from
      customer: {
        number: formattedPhone, // Customer's phone number with country code
      },
      assistantId: assistantId, // Tenant-specific VAPI assistant ID
      assistantOverrides: {
        variableValues: {
          // Map all form fields to variables the agent can use
          agentId: formData.agentId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          customerName: formData.customerName, // Full name for formal references
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          phoneNumber: formData.phoneNumber,
          email: formData.email || '',
          // Send products as both array and formatted string for agent flexibility
          products: Array.isArray(formData.products) 
            ? formData.products.join(', ') 
            : formData.products,
          productsList: Array.isArray(formData.products) 
            ? formData.products 
            : [formData.products],
          numberOfProducts: Array.isArray(formData.products) 
            ? formData.products.length 
            : 1,
          salesPrice: formData.salesPrice,
          interestRate: formData.interestRate || '',
          promotionalTerm: formData.promotionalTerm || '',
          amortization: formData.amortization || '',
          monthlyPayment: formData.monthlyPayment || '',
        },
      },
      metadata: {
        agentId: formData.agentId,
        customerName: formData.customerName,
        address: formData.address,
      },
    };

    console.log('Initiating VAPI call with data:', JSON.stringify(vapiCallRequest, null, 2));

    // Call VAPI API to initiate the phone call
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiCallRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VAPI API error:', response.status, errorText);
      throw new Error(`VAPI API error: ${response.status} - ${errorText}`);
    }

    const callData = await response.json();
    console.log('VAPI call initiated successfully:', callData);

    // Log to database and create customer if needed
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // First, create or get customer
        let customerId = formData.customerId; // May be passed if coming from customer detail page
        
        if (!customerId) {
          // Check if customer exists by phone number and tenant
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
              .eq('phone', cleanPhone)
            .eq('tenant_id', formData.tenantId)
            .maybeSingle();
          
          if (existingCustomer) {
            customerId = existingCustomer.id;
            console.log('Found existing customer:', customerId);
          } else {
            // Create new customer
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert({
                first_name: formData.firstName,
                last_name: formData.lastName,
                  phone: cleanPhone,
                email: formData.email || null,
                address: formData.address,
                city: formData.city || null,
                province: formData.province || null,
                postal_code: formData.postalCode || null,
                tenant_id: formData.tenantId,
                agent_id: formData.agentId, // Track which agent created this customer
              })
              .select('id')
              .single();
            
            if (customerError) {
              console.error('Failed to create customer:', customerError);
            } else {
              customerId = newCustomer.id;
              console.log('Created new customer:', customerId);
            }
          }
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from('tpv_requests')
          .insert({
            customer_id: customerId || null,
            tenant_id: formData.tenantId,
            agent_id: formData.agentId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            customer_name: formData.customerName, // Full name
            customer_phone: cleanPhone,
            customer_address: formData.address,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postalCode,
            email: formData.email,
            products: Array.isArray(formData.products) 
              ? formData.products.join(', ') 
              : formData.products,
            sales_price: formData.salesPrice,
            interest_rate: formData.interestRate,
            promotional_term: formData.promotionalTerm,
            amortization: formData.amortization,
            monthly_payment: formData.monthlyPayment,
            vapi_call_id: callData.id,
            status: 'initiated',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to log TPV request to database:', insertError);
        } else {
          console.log('TPV request logged to database successfully');
          
          // Trigger Google Sheets sync with the new record ID
          try {
            const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-to-google-sheets`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recordId: insertData.id,
              }),
            });
            
            if (!syncResponse.ok) {
              console.error('Failed to sync to Google Sheets:', await syncResponse.text());
            } else {
              console.log('Successfully synced to Google Sheets');
            }
          } catch (syncError) {
            console.error('Error syncing to Google Sheets:', syncError);
          }
        }
      } catch (dbError) {
        console.error('Error logging to database:', dbError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        callId: callData.id,
        message: 'TPV verification call initiated successfully',
        callData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in initiate-tpv-call function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
