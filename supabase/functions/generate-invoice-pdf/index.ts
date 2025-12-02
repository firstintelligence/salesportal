import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceData, templateNumber } = await req.json();
    
    console.log('Starting PDF generation for template:', templateNumber);

    // Launch headless browser
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to US Letter size (8.5" x 11" at 96 DPI)
    await page.setViewport({
      width: 816,  // 8.5 inches * 96 DPI
      height: 1056, // 11 inches * 96 DPI
      deviceScaleFactor: 2, // Higher quality rendering
    });

    // Construct the invoice render URL
    const baseUrl = Deno.env.get('VITE_SUPABASE_URL')?.replace('//', '//donhxrgrqeqnsmhtnazb.supabase.co') || '';
    const renderUrl = `${baseUrl}/invoice-render`;
    
    // Navigate to the invoice render page with data
    await page.goto(renderUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Inject invoice data and template number
    await page.evaluate((data, template) => {
      (window as any).__INVOICE_DATA__ = data;
      (window as any).__INVOICE_TEMPLATE__ = template;
      // Trigger render event
      window.dispatchEvent(new CustomEvent('invoice-data-ready'));
    }, invoiceData, templateNumber);

    // Wait for the invoice to render
    await page.waitForFunction(() => {
      return (window as any).__INVOICE_RENDERED__ === true;
    }, { timeout: 10000 });

    // Wait a bit more for fonts and images to load
    await page.waitForTimeout(1000);

    // Generate PDF with proper settings for text selectability
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.25in',
        right: '0.25in',
        bottom: '0.25in',
        left: '0.25in',
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

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