import { supabase } from '../integrations/supabase/client';
import { getTenantCompanyInfo } from './tenantLogos';
import { recordDocumentSignature, captureSigningLocation } from './signingLocationService';
import { calculateSubTotal, calculateTaxAmount } from './invoiceCalculations';

export const generatePDF = async (invoiceData, templateNumber, tenantSlug = 'georges', signingContext = null, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting server-side PDF generation...');
      
      // Check if current user is super admin - signing location stamp only visible to super admins
      const isSuperAdmin = options.isSuperAdmin || false;
      
      // Capture signing location BEFORE rendering for stamp on invoice (always capture for database, but only display for super admins)
      let signingLocation = null;
      try {
        signingLocation = await captureSigningLocation();
        console.log('Captured signing location:', signingLocation.location_string);
      } catch (locError) {
        console.error('Error capturing signing location:', locError);
      }
      
      // Add signing location to invoice data for rendering ONLY if super admin
      // The location is still recorded in the database for all documents
      const invoiceDataWithLocation = {
        ...invoiceData,
        signingLocation: isSuperAdmin ? signingLocation : null
      };
      
      // Render invoice to HTML
      const pdfContainer = document.createElement('div');
      document.body.appendChild(pdfContainer);
      
      pdfContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 794px;
        background-color: white;
        font-family: Arial, sans-serif;
      `;
      
      // Get the template and Consumer Protection Act page, then render them
      const { getTemplate } = await import('../utils/templateRegistry');
      const ConsumerProtectionActPage = (await import('../components/templates/ConsumerProtectionActPage')).default;
      const Template = getTemplate(templateNumber);
      const React = (await import('react')).default;
      const { createRoot } = await import('react-dom/client');
      
      // Extract company info for Consumer Protection Act page
      const companyInfo = invoiceDataWithLocation?.yourCompany ? {
        name: invoiceDataWithLocation.yourCompany.name,
        address: invoiceDataWithLocation.yourCompany.address,
        phone: invoiceDataWithLocation.yourCompany.phone,
        email: invoiceDataWithLocation.yourCompany.email
      } : null;
      
      // Create React root and render both template and Consumer Protection Act page
      // Use React.Fragment to avoid extra wrapper div that could cause blank pages
      const root = createRoot(pdfContainer);
      await new Promise((resolve) => {
        root.render(
          React.createElement(React.Fragment, null,
            React.createElement(Template, { data: invoiceDataWithLocation, showTermsAndConditions: true }),
            React.createElement(ConsumerProtectionActPage, { companyInfo })
          )
        );
        setTimeout(resolve, 500); // Wait for rendering
      });
      
      // Convert images to base64
      const convertImagesToBase64 = async (container) => {
        const images = container.querySelectorAll('img');
        const promises = Array.from(images).map(async (img) => {
          try {
            // Skip if image is already a data URL (like signatures)
            if (img.src.startsWith('data:')) {
              console.log('Skipping data URL image (already base64)');
              return;
            }
            
            // Wait for image to load
            await new Promise((resolve, reject) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = reject;
                // Timeout after 5 seconds
                setTimeout(() => resolve(), 5000);
              }
            });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            img.src = dataUrl;
          } catch (error) {
            console.warn('Could not convert image to base64:', error);
          }
        });
        await Promise.all(promises);
      };

      await convertImagesToBase64(pdfContainer);
      
      // Inline only essential visual styles
      const essentialProps = [
        'color', 'background-color', 'background', 'border', 'border-top', 'border-right', 
        'border-bottom', 'border-left', 'border-color', 'border-width', 'border-style',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
        'font-size', 'font-weight', 'font-family', 'line-height', 'text-align',
        'display', 'flex', 'flex-direction', 'justify-content', 'align-items',
        'gap', 'grid', 'grid-template-columns', 'position', 'top', 'left', 'right', 'bottom',
        'page-break-inside', 'break-inside', 'white-space'
      ];
      
      const inlineEssentialStyles = (element) => {
        const computedStyle = window.getComputedStyle(element);
        let styleString = '';
        
        essentialProps.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
            styleString += `${prop}:${value};`;
          }
        });
        
        if (styleString) {
          const existingStyle = element.getAttribute('style') || '';
          element.setAttribute('style', existingStyle + styleString);
        }
        
        Array.from(element.children).forEach(child => inlineEssentialStyles(child));
      };
      
      inlineEssentialStyles(pdfContainer.firstElementChild);
      
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{margin:0.25in;}*{margin:0;padding:0;box-sizing:border-box;}html,body{margin:0;padding:0;background:white;}body{font-family:Arial,sans-serif;}p{display:block;margin-bottom:0.25rem;}div{display:block;}h1,h2,h3,h4,h5,h6{display:block;}body>*:last-child{page-break-after:avoid !important;margin-bottom:0 !important;padding-bottom:0 !important;}</style></head><body>${pdfContainer.innerHTML.trim()}</body></html>`;
      
      // Cleanup DOM
      root.unmount();
      document.body.removeChild(pdfContainer);
      
      // Get tenant company info for CPA Bill 59 form
      const tenantInfo = getTenantCompanyInfo(tenantSlug);
      
      // Fetch the CPA Bill 59 form PDF and convert to base64
      let cpaBill59FormBase64 = null;
      try {
        const formResponse = await fetch('/templates/CPA_Bill_59_Form_Fillable.pdf');
        if (formResponse.ok) {
          const formArrayBuffer = await formResponse.arrayBuffer();
          const formBytes = new Uint8Array(formArrayBuffer);
          // Use chunked approach for large files (spread operator has stack limits)
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < formBytes.length; i += chunkSize) {
            const chunk = formBytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
          }
          cpaBill59FormBase64 = btoa(binary);
          console.log('CPA Bill 59 form loaded successfully, size:', formBytes.length, 'bytes, base64 length:', cpaBill59FormBase64.length);
        } else {
          console.warn('Could not fetch CPA Bill 59 form, status:', formResponse.status);
        }
      } catch (formError) {
        console.error('Error loading CPA Bill 59 form:', formError);
      }
      
      // Call the edge function to generate PDF with PDFShift
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: {
          html,
          invoiceData: invoiceDataWithLocation,
          tenantInfo,
          cpaBill59FormBase64
        }
      });

      if (error) {
        console.error('Error calling PDF generation function:', error);
        console.log('Falling back to client-side PDF generation...');
        // Fall back to client-side generation
        await generatePDFClientSide(invoiceData, templateNumber);
        resolve();
        return;
      }

      // Check if data is valid
      if (!data || !(data instanceof Blob)) {
        console.error('Invalid PDF response from server');
        console.log('Falling back to client-side PDF generation...');
        await generatePDFClientSide(invoiceData, templateNumber);
        resolve();
        return;
      }

      // The response is already a Blob from the edge function
      const pdfBlob = data;
      
      // Generate filename
      const { number } = invoiceDataWithLocation.invoice;
      const { firstName, lastName, name, address, city, province, postalCode } = invoiceDataWithLocation.billTo;
      
      const customerName = firstName && lastName 
        ? `${firstName} ${lastName}` 
        : name || "Customer";
      
      const fullAddress = `${address}, ${city}, ${province} ${postalCode}`;
      const fileName = `${customerName} - ${fullAddress} - ${number}.pdf`;
      
      // Generate a unique document ID
      const documentId = signingContext?.documentId || crypto.randomUUID();
      
      // Upload PDF to storage for future access
      let documentUrl = null;
      try {
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9\-_.]/g, '_');
        const storagePath = `${documentId}/${sanitizedFileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (uploadError) {
          console.error('Error uploading document to storage:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(storagePath);
          
          documentUrl = urlData?.publicUrl || null;
          console.log('Document uploaded to storage:', documentUrl);
        }
      } catch (storageError) {
        console.error('Error with document storage:', storageError);
      }

      // IMPORTANT: Record document signature BEFORE downloading PDF
      // Opening/downloading PDF can interrupt JavaScript execution
      if (signingContext || invoiceDataWithLocation.signature) {
        try {
          // Calculate invoice total amount for storage
          let invoiceAmount = null;
          if (invoiceDataWithLocation.items && Array.isArray(invoiceDataWithLocation.items)) {
            const subTotal = parseFloat(calculateSubTotal(invoiceDataWithLocation.items));
            const taxPercentage = invoiceDataWithLocation.taxPercentage || 0;
            const taxAmount = parseFloat(calculateTaxAmount(subTotal, taxPercentage));
            invoiceAmount = subTotal + taxAmount;
          }
          
          // Use pre-captured signing location instead of capturing again
          const signatureRecord = {
            document_type: signingContext?.documentType || 'invoice',
            document_id: documentId,
            customer_id: signingContext?.customerId || null,
            customer_name: signingContext?.customerName || `${invoiceDataWithLocation.billTo?.firstName || ''} ${invoiceDataWithLocation.billTo?.lastName || ''}`.trim(),
            agent_id: signingContext?.agentId || localStorage.getItem('agentId') || 'unknown',
            tenant_id: signingContext?.tenantId || null,
            signature_type: signingContext?.signatureType || 'customer',
            signed_at: new Date().toISOString(),
            document_url: documentUrl,
            invoice_amount: invoiceAmount,
            // Use pre-captured location data
            ip_address: signingLocation?.ip_address || null,
            latitude: signingLocation?.latitude || null,
            longitude: signingLocation?.longitude || null,
            city: signingLocation?.city || null,
            region: signingLocation?.region || null,
            country: signingLocation?.country || null,
            postal_code: signingLocation?.postal_code || null,
            timezone: signingLocation?.timezone || null,
            isp: signingLocation?.isp || null,
            location_string: signingLocation?.location_string || 'Location unavailable',
            user_agent: navigator.userAgent
          };
          
          const { data: sigData, error: sigError } = await supabase
            .from('document_signatures')
            .insert(signatureRecord)
            .select()
            .single();
          
          if (sigError) {
            console.error('Error recording document signature:', sigError);
          } else {
            console.log('Document signature recorded:', sigData.id);
          }
          
          // If there's a co-applicant signature, record that too
          if (invoiceDataWithLocation.coApplicantSignature) {
            const coApplicantRecord = {
              ...signatureRecord,
              customer_name: invoiceDataWithLocation.billTo?.coApplicantName || 'Co-Applicant',
              signature_type: 'co_applicant'
            };
            
            const { error: coSigError } = await supabase
              .from('document_signatures')
              .insert(coApplicantRecord);
            
            if (coSigError) {
              console.error('Error recording co-applicant signature:', coSigError);
            }
          }
        } catch (sigError) {
          console.error('Error recording document signature:', sigError);
          // Don't fail PDF generation if signature recording fails
        }
      }

      // NOW create download link (after all database operations are complete)
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('PDF downloaded successfully');
      resolve();
    } catch (error) {
      console.error('Error in PDF generation:', error);
      reject(error);
    }
  });
};

// Legacy client-side PDF generation (keeping as fallback)
export const generatePDFClientSide = async (invoiceData, templateNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      // Legacy implementation
      const pdfContainer = document.createElement('div');
      document.body.appendChild(pdfContainer);
      
      // US Letter size: 8.5" x 11" = 215.9mm x 279.4mm
      const pageWidthMM = 215.9;
      const pageHeightMM = 279.4;
      const marginMM = 6.35; // 0.25 inches = 6.35mm
      const contentWidthPX = 794; // Standard invoice width
      const contentHeightPX = 1123; // Standard invoice height
      
      // Style the container for PDF - exact template size
      pdfContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: ${contentWidthPX}px;
        min-height: ${contentHeightPX}px;
        background-color: white;
        font-family: Arial, sans-serif;
        overflow: visible;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      `;
      
      // Get the template and render it
      const { getTemplate } = await import('../utils/templateRegistry');
      const Template = getTemplate(templateNumber);
      const React = (await import('react')).default;
      const { createRoot } = await import('react-dom/client');
      
      // Create React root and render
      const root = createRoot(pdfContainer);
      await new Promise((resolve) => {
        root.render(React.createElement(Template, { data: invoiceData }));
        setTimeout(resolve, 500); // Wait for rendering
      });
      
      // Override any problematic styles and ensure table spacing consistency
      const allElements = pdfContainer.querySelectorAll('*');
      allElements.forEach(el => {
        const computed = window.getComputedStyle(el);
        if (computed.position === 'fixed' || computed.position === 'absolute') {
          el.style.position = 'relative';
        }
        if (computed.transform && computed.transform !== 'none') {
          el.style.transform = 'none';
        }
      });
      
      // Ensure table cells maintain exact spacing for PDF consistency
      const tableCells = pdfContainer.querySelectorAll('td');
      tableCells.forEach(cell => {
        const currentClasses = cell.className;
        if (currentClasses.includes('pt-0.5')) {
          cell.style.paddingTop = '2px !important';
        }
        if (currentClasses.includes('pb-2')) {
          cell.style.paddingBottom = '8px !important';
        }
        if (currentClasses.includes('px-3')) {
          cell.style.paddingLeft = '12px !important';
          cell.style.paddingRight = '12px !important';
        }
      });
      
      // Ensure content maintains original size
      const firstChild = pdfContainer.firstElementChild;
      if (firstChild) {
        firstChild.style.cssText += `
          width: 794px !important;
          height: auto !important;
          max-width: none !important;
          max-height: none !important;
          transform: none !important;
          overflow: visible !important;
        `;
      }
      
      // Wait for final layout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture as canvas for accurate rendering
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: contentWidthPX,
        height: contentHeightPX,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const contentWidthMM = pageWidthMM - (marginMM * 2);
      const contentHeightMM = pageHeightMM - (marginMM * 2);
      
      const pdf = new jsPDF('p', 'mm', [pageWidthMM, pageHeightMM]);
      const imageAspectRatio = canvas.width / canvas.height;
      const requiredHeightMM = contentWidthMM / imageAspectRatio;
      const finalHeight = Math.min(requiredHeightMM, contentHeightMM);
      
      pdf.addImage(imgData, 'PNG', marginMM, marginMM, contentWidthMM, finalHeight, undefined, 'FAST');
      
      // Generate filename
      const { number } = invoiceData.invoice;
      const { firstName, lastName, name, address, city, province, postalCode } = invoiceData.billTo;
      
      const customerName = firstName && lastName 
        ? `${firstName} ${lastName}` 
        : name || "Customer";
      
      const fullAddress = `${address}, ${city}, ${province} ${postalCode}`;
      const fileName = `${customerName} - ${fullAddress} - ${number}.pdf`;

      pdf.save(fileName);
      
      // Cleanup
      root.unmount();
      document.body.removeChild(pdfContainer);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
