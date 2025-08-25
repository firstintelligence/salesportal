import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (invoiceData, templateNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a dedicated PDF container
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
      
      // Get actual rendered height to determine if we need multiple pages
      const actualHeight = firstChild ? firstChild.scrollHeight : contentHeightPX;
      
      const canvas = await html2canvas(pdfContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: contentWidthPX,
        height: actualHeight,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [pageWidthMM, pageHeightMM]);
      
      // Calculate content area dimensions
      const contentWidthMM = pageWidthMM - (marginMM * 2);
      const contentHeightMM = pageHeightMM - (marginMM * 2);
      
      // Calculate the required height to maintain aspect ratio
      const imageAspectRatio = canvas.width / canvas.height;
      const requiredHeightMM = contentWidthMM / imageAspectRatio;
      
      if (requiredHeightMM <= contentHeightMM) {
        // Content fits on one page - center it properly
        pdf.addImage(imgData, 'PNG', marginMM, marginMM, contentWidthMM, requiredHeightMM, undefined, 'FAST');
      } else {
        // Content needs multiple pages - use better page break logic
        const maxHeightPerPagePX = (contentHeightMM / contentWidthMM) * canvas.width;
        let currentY = 0;
        let pageNumber = 0;
        
        while (currentY < canvas.height) {
          if (pageNumber > 0) {
            pdf.addPage();
          }
          
          // Calculate the height for this page
          const remainingHeight = canvas.height - currentY;
          const pageHeight = Math.min(maxHeightPerPagePX, remainingHeight);
          
          // Create a canvas for this page section
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeight;
          
          // Fill with white background
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          // Draw the portion of the original canvas for this page
          pageCtx.drawImage(
            canvas, 
            0, currentY, canvas.width, pageHeight,
            0, 0, canvas.width, pageHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageAspectRatio = pageCanvas.width / pageCanvas.height;
          const pageHeightMM = contentWidthMM / pageAspectRatio;
          
          pdf.addImage(pageImgData, 'PNG', marginMM, marginMM, contentWidthMM, pageHeightMM, undefined, 'FAST');
          
          currentY += pageHeight;
          pageNumber++;
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
