import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format date as DD/MM/YYYY
function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceData } = await req.json();
    console.log('Generating Custom Invoice V2 PDF...');

    // Fetch the template PDF
    const templateUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/documents/Custom_Invoice_V2_Fillable.pdf`;
    
    // Try to fetch from storage, if not available, create a new PDF
    let pdfDoc: PDFDocument;
    let useTemplate = false;
    
    try {
      const templateResponse = await fetch(templateUrl);
      if (templateResponse.ok) {
        const templateBytes = await templateResponse.arrayBuffer();
        pdfDoc = await PDFDocument.load(templateBytes);
        useTemplate = true;
        console.log('Loaded template PDF from storage');
      } else {
        console.log('Template not found in storage, creating new PDF');
        pdfDoc = await PDFDocument.create();
      }
    } catch (e) {
      console.log('Could not load template, creating new PDF:', e);
      pdfDoc = await PDFDocument.create();
    }

    // Get fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // If no template, create the page layout manually
    if (!useTemplate) {
      // Create a letter-sized page (8.5" x 11")
      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      
      // Draw header
      page.drawText('INVOICE', {
        x: 50,
        y: height - 50,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      // Company name from tenant
      const companyName = invoiceData.tenantInfo?.name || 'Your Company';
      page.drawText(companyName, {
        x: 50,
        y: height - 80,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0.4, 0.2),
      });

      // Company contact info
      const phone = invoiceData.tenantInfo?.phone || '';
      const email = invoiceData.tenantInfo?.email || '';
      if (phone) {
        page.drawText(phone, {
          x: 50,
          y: height - 100,
          size: 10,
          font: helvetica,
        });
      }
      if (email) {
        page.drawText(`Email: ${email}`, {
          x: 50,
          y: height - 115,
          size: 10,
          font: helvetica,
        });
      }

      // Customer Information section
      let yPos = height - 160;
      
      // Customer details
      const customerInfo = invoiceData.customerInfo || {};
      page.drawText('Customer Information', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBold,
      });
      yPos -= 20;

      const customerFields = [
        ['Name:', `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`],
        ['Address:', customerInfo.address || ''],
        ['Postal Code:', customerInfo.postalCode || ''],
        ['Position:', customerInfo.positionTitle || ''],
        ['Length of Employment:', customerInfo.lengthOfEmployment || ''],
        ['Annual Income:', customerInfo.annualIncome || ''],
      ];

      for (const [label, value] of customerFields) {
        page.drawText(`${label} ${value}`, {
          x: 50,
          y: yPos,
          size: 10,
          font: helvetica,
        });
        yPos -= 15;
      }

      // Installation Checklist
      yPos -= 20;
      page.drawText('Installation Checklist', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBold,
      });
      yPos -= 20;

      const checklist = invoiceData.checklist || {};
      const checklistItems = [
        `Existing AC: ${checklist.existingAC || 'N/A'}`,
        `R.O. Granite/Quartz: ${checklist.roGranite ? 'Yes' : 'No'}`,
        `Bathrooms: ${checklist.bathrooms || 'N/A'}`,
        `Attic Accessible: ${checklist.atticAccessible ? 'Yes' : 'No'}`,
        `Wi-Fi: ${checklist.wifi || 'N/A'}`,
        `Electrical Outlet: ${checklist.electricalOutlet ? 'Yes' : 'No'}`,
        `SqFt: ${checklist.sqFt || 'N/A'}`,
        `Occupants: ${checklist.occupantsNo || 'N/A'}`,
      ];

      for (const item of checklistItems) {
        page.drawText(item, {
          x: 50,
          y: yPos,
          size: 10,
          font: helvetica,
        });
        yPos -= 15;
      }

      // Products Section
      yPos -= 20;
      page.drawText('Products', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBold,
      });
      yPos -= 20;

      // Energy Efficiency
      page.drawText('Energy Efficiency:', {
        x: 50,
        y: yPos,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0.5, 0.3),
      });
      yPos -= 15;

      const energyProducts = invoiceData.energyEfficiency || {};
      for (const [key, qty] of Object.entries(energyProducts)) {
        if (qty) {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          page.drawText(`${qty}x ${label}`, {
            x: 60,
            y: yPos,
            size: 9,
            font: helvetica,
          });
          yPos -= 12;
        }
      }

      // Home Comfort
      yPos -= 10;
      page.drawText('Home Comfort:', {
        x: 50,
        y: yPos,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0.3, 0.6),
      });
      yPos -= 15;

      const comfortProducts = invoiceData.homeComfort || {};
      for (const [key, qty] of Object.entries(comfortProducts)) {
        if (qty) {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          page.drawText(`${qty}x ${label}`, {
            x: 60,
            y: yPos,
            size: 9,
            font: helvetica,
          });
          yPos -= 12;
        }
      }

      // Smart Solutions
      yPos -= 10;
      page.drawText('Smart Solutions:', {
        x: 50,
        y: yPos,
        size: 10,
        font: helveticaBold,
        color: rgb(0.4, 0, 0.5),
      });
      yPos -= 15;

      const smartProducts = invoiceData.smartSolutions || {};
      for (const [key, qty] of Object.entries(smartProducts)) {
        if (qty) {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          page.drawText(`${qty}x ${label}`, {
            x: 60,
            y: yPos,
            size: 9,
            font: helvetica,
          });
          yPos -= 12;
        }
      }

      // Special Arrangements
      if (invoiceData.specialArrangements) {
        yPos -= 15;
        page.drawText('Special Arrangements:', {
          x: 50,
          y: yPos,
          size: 10,
          font: helveticaBold,
        });
        yPos -= 15;
        page.drawText(invoiceData.specialArrangements.substring(0, 80), {
          x: 60,
          y: yPos,
          size: 9,
          font: helvetica,
        });
        yPos -= 12;
      }

      // Financial Section
      yPos -= 20;
      page.drawText('Financial Details', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBold,
      });
      yPos -= 20;

      const financial = invoiceData.financial || {};
      const financialItems = [
        ['Subtotal:', `$${financial.subtotal || '0.00'}`],
        ['Term:', `${financial.termMonths || '0'} months`],
        ['Monthly Payment:', `$${financial.monthlyPayment || '0.00'}`],
        ['Amortization:', `${financial.amortizationMonths || '0'} months`],
        ['Interest Rate:', `${financial.interestRate || '0'}%`],
        ['Admin Fee:', `$${financial.adminFee || '99.95'}`],
        ['HST:', `$${financial.hst || '0.00'}`],
        ['Rebates:', `-$${financial.rebates || '0.00'}`],
      ];

      for (const [label, value] of financialItems) {
        page.drawText(`${label} ${value}`, {
          x: 50,
          y: yPos,
          size: 10,
          font: helvetica,
        });
        yPos -= 15;
      }

      // Consent checkboxes
      yPos -= 15;
      page.drawText(`Privacy Policy: ${financial.acceptPrivacyPolicy ? '☑' : '☐'}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: helvetica,
      });
      yPos -= 12;
      page.drawText(`Electronic Consent: ${financial.electronicConsent ? '☑' : '☐'}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: helvetica,
      });
      yPos -= 12;
      page.drawText(`Credit Consent: ${financial.creditConsent ? '☑' : '☐'}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: helvetica,
      });

      // Signatures Section
      yPos -= 30;
      page.drawText('Signatures', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBold,
      });
      yPos -= 25;

      const signatures = invoiceData.signatures || {};

      // Draw signature lines
      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: 250, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      page.drawText('Customer Signature', {
        x: 50,
        y: yPos - 12,
        size: 8,
        font: helvetica,
      });
      page.drawText(signatures.customerName || '', {
        x: 50,
        y: yPos - 24,
        size: 10,
        font: helvetica,
      });

      page.drawLine({
        start: { x: 320, y: yPos },
        end: { x: 520, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      page.drawText('Agent Signature', {
        x: 320,
        y: yPos - 12,
        size: 8,
        font: helvetica,
      });
      page.drawText(signatures.agentName || '', {
        x: 320,
        y: yPos - 24,
        size: 10,
        font: helvetica,
      });

      // Draw signatures if provided
      if (signatures.customerSignature) {
        try {
          const sigBytes = base64ToUint8Array(signatures.customerSignature);
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const sigDims = sigImage.scale(0.3);
          page.drawImage(sigImage, {
            x: 50,
            y: yPos + 10,
            width: Math.min(sigDims.width, 150),
            height: Math.min(sigDims.height, 50),
          });
        } catch (e) {
          console.log('Could not embed customer signature:', e);
        }
      }

      if (signatures.agentSignature) {
        try {
          const sigBytes = base64ToUint8Array(signatures.agentSignature);
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const sigDims = sigImage.scale(0.3);
          page.drawImage(sigImage, {
            x: 320,
            y: yPos + 10,
            width: Math.min(sigDims.width, 150),
            height: Math.min(sigDims.height, 50),
          });
        } catch (e) {
          console.log('Could not embed agent signature:', e);
        }
      }

      // Date
      yPos -= 50;
      page.drawText(`Date Signed: ${formatDate(signatures.signDate)}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
      });

      // Embed tenant logo if available
      if (invoiceData.tenantInfo?.logo) {
        try {
          // Fetch the logo
          let logoUrl = invoiceData.tenantInfo.logo;
          if (logoUrl.startsWith('/')) {
            logoUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}${logoUrl}`;
          }
          
          const logoResponse = await fetch(logoUrl);
          if (logoResponse.ok) {
            const logoBytes = await logoResponse.arrayBuffer();
            const contentType = logoResponse.headers.get('content-type') || '';
            
            let logoImage;
            if (contentType.includes('png')) {
              logoImage = await pdfDoc.embedPng(logoBytes);
            } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
              logoImage = await pdfDoc.embedJpg(logoBytes);
            }
            
            if (logoImage) {
              const logoDims = logoImage.scale(0.15);
              page.drawImage(logoImage, {
                x: width - logoDims.width - 50,
                y: height - logoDims.height - 30,
                width: logoDims.width,
                height: logoDims.height,
              });
            }
          }
        } catch (e) {
          console.log('Could not embed logo:', e);
        }
      }
    } else {
      // Template exists - fill the form fields
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      console.log('Available form fields:', fields.map(f => f.getName()));

      // Try to fill known fields
      const customerInfo = invoiceData.customerInfo || {};
      const financial = invoiceData.financial || {};
      const signatures = invoiceData.signatures || {};

      // Helper to safely set text field
      const setTextField = (name: string, value: string) => {
        try {
          const field = form.getTextField(name);
          if (field) {
            field.setText(value || '');
          }
        } catch (e) {
          console.log(`Field ${name} not found or error:`, e);
        }
      };

      // Fill customer info fields
      setTextField('First Name', customerInfo.firstName || '');
      setTextField('Last Name', customerInfo.lastName || '');
      setTextField('Address', customerInfo.address || '');
      setTextField('Postal Code', customerInfo.postalCode || '');
      setTextField('Position Title', customerInfo.positionTitle || '');
      setTextField('Length of Employment', customerInfo.lengthOfEmployment || '');
      setTextField('Annual Income', customerInfo.annualIncome || '');

      // Financial fields
      setTextField('Subtotal', `$${financial.subtotal || ''}`);
      setTextField('Term Months', financial.termMonths || '');
      setTextField('Monthly Payment', `$${financial.monthlyPayment || ''}`);
      setTextField('Amortization Months', financial.amortizationMonths || '');
      setTextField('Your Interest Rate', `${financial.interestRate || ''}%`);
      setTextField('Admin Fee', `$${financial.adminFee || '99.95'}`);
      setTextField('HST', `$${financial.hst || ''}`);
      setTextField('REBATES', `-$${financial.rebates || ''}`);

      // Signature fields
      setTextField('Customer Name', signatures.customerName || '');
      setTextField('Agent Name', signatures.agentName || '');
      setTextField('DATE SIGNED', formatDate(signatures.signDate));

      // Flatten the form to make it non-editable
      form.flatten();

      // Get the first page to add tenant logo
      const pages = pdfDoc.getPages();
      if (pages.length > 0) {
        const page = pages[0];
        const { width, height } = page.getSize();

        // Embed tenant logo if available
        if (invoiceData.tenantInfo?.logo) {
          try {
            let logoUrl = invoiceData.tenantInfo.logo;
            if (logoUrl.startsWith('/')) {
              logoUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}${logoUrl}`;
            }
            
            const logoResponse = await fetch(logoUrl);
            if (logoResponse.ok) {
              const logoBytes = await logoResponse.arrayBuffer();
              const contentType = logoResponse.headers.get('content-type') || '';
              
              let logoImage;
              if (contentType.includes('png')) {
                logoImage = await pdfDoc.embedPng(logoBytes);
              } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                logoImage = await pdfDoc.embedJpg(logoBytes);
              }
              
              if (logoImage) {
                const logoDims = logoImage.scale(0.2);
                // Position in top-right area
                page.drawImage(logoImage, {
                  x: width - logoDims.width - 30,
                  y: height - logoDims.height - 20,
                  width: logoDims.width,
                  height: logoDims.height,
                });
              }
            }
          } catch (e) {
            console.log('Could not embed logo:', e);
          }
        }

        // Embed signatures on the page
        if (signatures.customerSignature) {
          try {
            const sigBytes = base64ToUint8Array(signatures.customerSignature);
            const sigImage = await pdfDoc.embedPng(sigBytes);
            const sigDims = sigImage.scale(0.25);
            // Position over customer signature area
            page.drawImage(sigImage, {
              x: 50,
              y: 80,
              width: Math.min(sigDims.width, 120),
              height: Math.min(sigDims.height, 40),
            });
          } catch (e) {
            console.log('Could not embed customer signature:', e);
          }
        }

        if (signatures.agentSignature) {
          try {
            const sigBytes = base64ToUint8Array(signatures.agentSignature);
            const sigImage = await pdfDoc.embedPng(sigBytes);
            const sigDims = sigImage.scale(0.25);
            // Position over agent signature area
            page.drawImage(sigImage, {
              x: 320,
              y: 80,
              width: Math.min(sigDims.width, 120),
              height: Math.min(sigDims.height, 40),
            });
          } catch (e) {
            console.log('Could not embed agent signature:', e);
          }
        }
      }
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64 for response
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    console.log('PDF generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfBase64,
        message: 'PDF generated successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
