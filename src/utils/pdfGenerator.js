import { supabase } from '../integrations/supabase/client';
import { getTenantCompanyInfo } from './tenantLogos';

export const generatePDF = async (invoiceData, templateNumber, tenantSlug = 'georges') => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting server-side PDF generation...');
      
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
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; background: white; }
              p { display: block; margin-bottom: 0.25rem; }
              div { display: block; }
              h1, h2, h3, h4, h5, h6 { display: block; }
            </style>
          </head>
          <body>
            ${pdfContainer.innerHTML}
          </body>
        </html>
      `;
      
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
          cpaBill59FormBase64 = btoa(String.fromCharCode(...formBytes));
          console.log('CPA Bill 59 form loaded, size:', formBytes.length, 'bytes');
        } else {
          console.warn('Could not fetch CPA Bill 59 form');
        }
      } catch (formError) {
        console.warn('Error loading CPA Bill 59 form:', formError);
      }
      
      // Call the edge function to generate PDF with PDFShift
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: {
          html,
          invoiceData,
          tenantInfo,
          cpaBill59FormBase64
        }
      });

      if (error) {
        console.error('Error calling PDF generation function:', error);
        throw error;
      }

      // The response is already a Blob from the edge function
      const pdfBlob = data;
      
      // Generate filename
      const { number } = invoiceData.invoice;
      const { firstName, lastName, name, address, city, province, postalCode } = invoiceData.billTo;
      
      const customerName = firstName && lastName 
        ? `${firstName} ${lastName}` 
        : name || "Customer";
      
      const fullAddress = `${address}, ${city}, ${province} ${postalCode}`;
      const fileName = `${customerName} - ${fullAddress} - ${number}.pdf`;

      // Create download link
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
