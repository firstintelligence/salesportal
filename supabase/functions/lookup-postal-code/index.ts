import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, city, province } = await req.json();
    
    console.log('Postal code lookup request:', { address, city, province });

    if (!address || !city || !province) {
      return new Response(
        JSON.stringify({ error: 'Address, city, and province are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullAddress = `${address}, ${city}, ${province}, Canada`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Use Google Geocoding API (server-side key without referrer restrictions)
    const apiKey = Deno.env.get('GOOGLE_GEOCODING_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_GEOCODING_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', postalCode: null }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Google Geocoding API for:', fullAddress);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&components=country:CA&key=${apiKey}`
    );

    const data = await response.json();
    console.log('Google API response status:', data.status);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const postalComponent = result.address_components?.find(
        (component: any) => component.types.includes('postal_code')
      );
      
      if (postalComponent) {
        let postalCode = postalComponent.long_name;
        // Format postal code
        postalCode = postalCode.replace(/\s/g, '').toUpperCase();
        if (postalCode.length === 6) {
          postalCode = `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`;
        }
        
        console.log('Found postal code:', postalCode);
        
        return new Response(
          JSON.stringify({ postalCode, source: 'google' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fallback to Nominatim if Google doesn't return postal code
    console.log('Google did not return postal code, trying Nominatim fallback');
    
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&countrycodes=ca&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'WorkifySalesPortal/1.0 (postal-code-lookup)',
        },
      }
    );

    const nominatimData = await nominatimResponse.json();
    
    if (nominatimData && nominatimData.length > 0 && nominatimData[0].address) {
      let postalCode = nominatimData[0].address.postcode;
      if (postalCode) {
        postalCode = postalCode.replace(/\s/g, '').toUpperCase();
        if (postalCode.length === 6) {
          postalCode = `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`;
        }
        
        console.log('Found postal code from Nominatim:', postalCode);
        
        return new Response(
          JSON.stringify({ postalCode, source: 'nominatim' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('No postal code found from any source');
    return new Response(
      JSON.stringify({ postalCode: null, error: 'Postal code not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in postal code lookup:', error);
    return new Response(
      JSON.stringify({ error: error.message, postalCode: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
