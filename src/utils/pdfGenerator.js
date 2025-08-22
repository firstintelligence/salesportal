import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (invoiceData, templateNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a dedicated PDF container
      const pdfContainer = document.createElement('div');
      document.body.appendChild(pdfContainer);
      
      // US Letter size: 8.5" x 11" = 215.9mm x 279.4mm
      // Negative margins for maximum content expansion
      const pageWidthMM = 215.9;
      const pageHeightMM = 279.4;
      const marginMM = -2; // Negative margins to expand content
      const contentWidthPX = (pageWidthMM - (marginMM * 2)) * 3.78; // Convert mm to px
      const contentHeightPX = (pageHeightMM - (marginMM * 2)) * 3.78;
      
      // Style the container for PDF
      pdfContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: ${contentWidthPX}px;
        height: ${contentHeightPX}px;
        background-color: white;
        font-family: Arial, sans-serif;
        overflow: hidden;
        padding: 20px;
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
      
      // Override any problematic styles
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
      
      // Scale content to fit
      const firstChild = pdfContainer.firstElementChild;
      if (firstChild) {
        firstChild.style.cssText += `
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          transform: scale(1.0) !important;
          transform-origin: top left !important;
          overflow: hidden !important;
        `;
      }
      
      // Wait for final layout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: contentWidthPX,
        height: contentHeightPX,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [pageWidthMM, pageHeightMM]);
      
      // Calculate how many pages we need based on content height
      const contentWidthMM = pageWidthMM - (marginMM * 2);
      const contentHeightMM = pageHeightMM - (marginMM * 2);
      const aspectRatio = canvas.width / canvas.height;
      const requiredHeight = contentWidthMM / aspectRatio;
      
      if (requiredHeight <= contentHeightMM) {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', marginMM, marginMM, contentWidthMM, requiredHeight, undefined, 'FAST');
      } else {
        // Content needs multiple pages
        const numberOfPages = Math.ceil(requiredHeight / contentHeightMM);
        const pageHeight = canvas.height / numberOfPages;
        
        for (let i = 0; i < numberOfPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          // Create a canvas for this page section
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeight;
          
          // Draw the portion of the original canvas for this page
          pageCtx.drawImage(
            canvas, 
            0, i * pageHeight, canvas.width, pageHeight,
            0, 0, canvas.width, pageHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', marginMM, marginMM, contentWidthMM, contentHeightMM, undefined, 'FAST');
        }
      }
      
      // Generate filename in format: "John Smith - 123 Main Street, Toronto, ON A1A 1A1 - GPHJS1234"
      const { number } = invoiceData.invoice;
      const { firstName, lastName, name, address, city, province, postalCode } = invoiceData.billTo;
      
      // Use firstName + lastName if available, otherwise fall back to name
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
