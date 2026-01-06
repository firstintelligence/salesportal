import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format date as "Month DD, YYYY"
const formatDateFull = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

// Decode base64 string to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, invoiceData, tenantInfo, cpaBill59FormBase64 } = await req.json();
    
    console.log('Starting PDF generation with PDFShift');
    console.log('Tenant info:', tenantInfo);
    console.log('CPA Bill 59 Form provided:', !!cpaBill59FormBase64);

    const apiKey = Deno.env.get('PDFSHIFT_API_KEY');
    if (!apiKey) {
      throw new Error('PDFSHIFT_API_KEY not configured');
    }

    // Step 1: Generate the invoice PDF from HTML
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

    const invoicePdfBytes = await pdfShiftResponse.arrayBuffer();
    console.log('Invoice PDF generated successfully, size:', invoicePdfBytes.byteLength, 'bytes');

    // Step 2: Create CPA Bill 59 Form as first page
    let finalPdfBytes: Uint8Array;

    if (!cpaBill59FormBase64) {
      console.warn('No CPA Bill 59 Form provided, proceeding without it');
      // Still add page numbers even without CPA form
      const invoicePdf = await PDFDocument.load(invoicePdfBytes);
      const allPages = invoicePdf.getPages();
      const totalPages = allPages.length;
      const pageNumberFont = await invoicePdf.embedFont(StandardFonts.Helvetica);
      
      for (let i = 0; i < totalPages; i++) {
        const page = allPages[i];
        const { width } = page.getSize();
        const pageNumberText = `Page ${i + 1} of ${totalPages}`;
        const textWidth = pageNumberFont.widthOfTextAtSize(pageNumberText, 10);
        
        // Draw page number at bottom right of page
        page.drawText(pageNumberText, {
          x: width - textWidth - 30,
          y: 15,
          size: 10,
          font: pageNumberFont,
          color: rgb(0, 0, 0),
        });
      }
      console.log(`Added page numbers to ${totalPages} pages (no CPA form)`);
      finalPdfBytes = await invoicePdf.save();
    } else {
      try {
        // Decode the base64 PDF
        const formPdfBytes = base64ToUint8Array(cpaBill59FormBase64);
        console.log('CPA Bill 59 form decoded, size:', formPdfBytes.byteLength, 'bytes');

        // Load the CPA form PDF
        const cpaPdf = await PDFDocument.load(formPdfBytes);
        const helveticaFont = await cpaPdf.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await cpaPdf.embedFont(StandardFonts.HelveticaBold);
        
        // Try to get form fields
        let form;
        try {
          form = cpaPdf.getForm();
          const fields = form.getFields();
          console.log('Available form fields:', fields.map(f => `${f.getName()} (${f.constructor.name})`));
        } catch (formError) {
          console.log('No form fields found or error getting form:', formError);
          form = null;
        }

        // Extract customer info
        const { firstName, lastName } = invoiceData.billTo || {};
        const signature = invoiceData.signature; // Signature is at top level
        const customerName = firstName && lastName ? `${firstName} ${lastName}` : (invoiceData.billTo?.name || '');
        const companyName = tenantInfo?.name || "George's Plumbing and Heating";
        const currentDate = formatDateFull(new Date());
        
        console.log('Customer Name:', customerName);
        console.log('Company Name:', companyName);
        console.log('Current Date:', currentDate);
        console.log('Signature provided:', !!signature);

        // Get the first page for drawing
        const pages = cpaPdf.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        console.log('Page size:', width, 'x', height);

        // Try to fill form fields if they exist
        if (form) {
          const fields = form.getFields();
          
          // Fill known fields by exact name
          try {
            const companyField = form.getTextField('Company Name');
            companyField.setText(companyName);
            companyField.setFontSize(12);
            companyField.updateAppearances(helveticaBoldFont);
            console.log(`Set "Company Name" to: ${companyName} (bold)`);
          } catch (e) {
            console.log('Could not set Company Name field:', e.message);
          }
          
          try {
            const firstNameField = form.getTextField('First Name');
            firstNameField.setText(firstName || '');
            firstNameField.setFontSize(12);
            console.log(`Set "First Name" to: ${firstName}`);
          } catch (e) {
            console.log('Could not set First Name field:', e.message);
          }
          
          try {
            const lastNameField = form.getTextField('Last Name');
            lastNameField.setText(lastName || '');
            lastNameField.setFontSize(12);
            console.log(`Set "Last Name" to: ${lastName}`);
          } catch (e) {
            console.log('Could not set Last Name field:', e.message);
          }
          
          try {
            const dateField = form.getTextField('Month_es_:date');
            dateField.setText(currentDate);
            dateField.setFontSize(12);
            console.log(`Set "Month_es_:date" to: ${currentDate}`);
          } catch (e) {
            console.log('Could not set date field:', e.message);
          }
          
          try {
            const purposeField = form.getTextField('Purpose');
            purposeField.setText('For the supply and/or installation of one or more of the products/services listed above.');
            purposeField.setFontSize(12);
            purposeField.updateAppearances(helveticaBoldFont);
            console.log(`Set "Purpose" field (bold)`);
          } catch (e) {
            console.log('Could not set Purpose field:', e.message);
          }
          
          // Flatten the form BEFORE drawing signature so fields are committed
          try {
            form.flatten();
            console.log('Form flattened successfully');
          } catch (flattenError) {
            console.log('Error flattening form:', flattenError);
          }
          
          // Handle signature - draw directly on page after flattening
          if (signature && signature.startsWith('data:image')) {
            try {
              const signatureBase64 = signature.split(',')[1];
              const signatureBytes = base64ToUint8Array(signatureBase64);
              const signatureImage = await cpaPdf.embedPng(signatureBytes);
              
              // Get original signature dimensions and preserve aspect ratio
              const origWidth = signatureImage.width;
              const origHeight = signatureImage.height;
              const aspectRatio = origWidth / origHeight;
              
              // Increased signature size (2-3x bigger) - consistent across all pages
              // 120px height matches the Template4.jsx signature container
              const maxWidth = 350;
              const maxHeight = 90;
              
              let drawWidth: number;
              let drawHeight: number;
              
              // Calculate dimensions preserving aspect ratio
              if (origWidth / maxWidth > origHeight / maxHeight) {
                // Width is the limiting factor
                drawWidth = maxWidth;
                drawHeight = maxWidth / aspectRatio;
              } else {
                // Height is the limiting factor
                drawHeight = maxHeight;
                drawWidth = maxHeight * aspectRatio;
              }
              
              // Position signature in the signature area of CPA form
              // Moved right by ~1 inch (72 points) from original x:80 to x:152
              firstPage.drawImage(signatureImage, {
                x: 152,
                y: 75,
                width: drawWidth,
                height: drawHeight,
              });
              console.log(`Signature embedded on page: original ${origWidth}x${origHeight}, drawn ${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)}`);
            } catch (sigError) {
              console.log('Error embedding signature:', sigError.message);
            }
          } else {
            console.log('No signature provided or invalid format');
          }
        } else {
          // If no form fields, draw text directly on the page
          console.log('Drawing text directly on page (no form fields)');
          
          // These positions are approximate - may need adjustment based on actual PDF layout
          // Company name field (approximate position)
          firstPage.drawText(companyName, {
            x: 280,
            y: 355,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          // Customer name field (approximate position)
          firstPage.drawText(customerName, {
            x: 100,
            y: 147,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          // Date field (approximate position)
          firstPage.drawText(currentDate, {
            x: 450,
            y: 147,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }

        // Create the final merged PDF
        const mergedPdf = await PDFDocument.create();
        
        // Copy all pages from CPA form (should be 1 page)
        const cpaPages = await mergedPdf.copyPages(cpaPdf, cpaPdf.getPageIndices());
        cpaPages.forEach(page => mergedPdf.addPage(page));

        // Load and copy all pages from invoice PDF
        const invoicePdf = await PDFDocument.load(invoicePdfBytes);
        const invoicePages = await mergedPdf.copyPages(invoicePdf, invoicePdf.getPageIndices());
        invoicePages.forEach(page => mergedPdf.addPage(page));

        // Add page numbers to all pages
        const allPages = mergedPdf.getPages();
        const totalPages = allPages.length;
        const pageNumberFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
        
        for (let i = 0; i < totalPages; i++) {
          const page = allPages[i];
          const { width } = page.getSize();
          const pageNumberText = `Page ${i + 1} of ${totalPages}`;
          const textWidth = pageNumberFont.widthOfTextAtSize(pageNumberText, 10);
          
          // Draw page number at bottom right of page
          page.drawText(pageNumberText, {
            x: width - textWidth - 30,
            y: 15,
            size: 10,
            font: pageNumberFont,
            color: rgb(0, 0, 0),
          });
        }
        console.log(`Added page numbers to ${totalPages} pages`);

        finalPdfBytes = await mergedPdf.save();
        console.log('Final merged PDF size:', finalPdfBytes.byteLength, 'bytes');
      } catch (formError) {
        console.error('Error processing CPA form, proceeding without it:', formError);
        finalPdfBytes = new Uint8Array(invoicePdfBytes);
      }
    }

    // Generate filename
    const { number } = invoiceData.invoice;
    const { firstName, lastName, name, address, city, province, postalCode } = invoiceData.billTo;
    
    const customerName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : name || "Customer";
    
    const fullAddress = `${address}, ${city}, ${province} ${postalCode}`;
    const fileName = `${customerName} - ${fullAddress} - ${number}.pdf`;

    return new Response(finalPdfBytes, {
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
