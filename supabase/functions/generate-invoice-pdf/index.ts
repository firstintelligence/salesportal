import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, invoiceData } = await req.json();
    
    console.log('Starting PDF generation with PDFShift');

    const apiKey = Deno.env.get('PDFSHIFT_API_KEY');
    if (!apiKey) {
      throw new Error('PDFSHIFT_API_KEY not configured');
    }

    // Call PDFShift API
    const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: html,
        format: 'Letter',
        margin: {
          top: '0.25in',
          right: '0.25in',
          bottom: '0.25in',
          left: '0.25in',
        },
        use_print: true,
      }),
    });

    if (!pdfShiftResponse.ok) {
      const errorText = await pdfShiftResponse.text();
      console.error('PDFShift error:', errorText);
      throw new Error(`PDFShift API error: ${pdfShiftResponse.status}`);
    }

    const pdfBuffer = await pdfShiftResponse.arrayBuffer();
    console.log('PDF generated successfully, size:', pdfBuffer.byteLength, 'bytes');

    // Generate filename
    const { number } = invoiceData.invoice;
    const { firstName, lastName, name, address, city, province, postalCode } = invoiceData.billTo;
    
    const customerName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : name || "Customer";
    
    const fullAddress = `${address}, ${city}, ${province} ${postalCode}`;
    const fileName = `${customerName} - ${fullAddress} - ${number}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});