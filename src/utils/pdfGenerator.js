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
      
      // Get actual rendered height to determine if we need multiple pages
      const actualHeight = firstChild ? firstChild.scrollHeight : contentHeightPX;
      
      // Always ensure signature section fits by creating pages that prevent cutoffs
      const pageBreakThreshold = contentHeightPX * 0.95; // 5% buffer to prevent cutoffs
      const needsMultiplePages = actualHeight > pageBreakThreshold;
      
      const canvas = await html2canvas(pdfContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: contentWidthPX,
        height: needsMultiplePages ? actualHeight : contentHeightPX,
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
      
      if (!needsMultiplePages || requiredHeightMM <= contentHeightMM * 0.9) {
        // Content fits on one page with signature section - ensure bottom isn't cut off
        const finalHeight = Math.min(requiredHeightMM, contentHeightMM * 0.9);
        pdf.addImage(imgData, 'PNG', marginMM, marginMM, contentWidthMM, finalHeight, undefined, 'FAST');
      } else {
        // Content needs multiple pages - calculate total pages with signature space reserved
        const maxHeightPerPagePX = (contentHeightMM * 0.85 / contentWidthMM) * canvas.width; // Reserve 15% for signature
        let totalPages = 0;
        let tempY = 0;
        
        // Calculate total pages needed
        while (tempY < canvas.height) {
          const remainingHeight = canvas.height - tempY;
          const pageHeight = Math.min(maxHeightPerPagePX, remainingHeight);
          
          if (pageHeight < 100) { // Skip pages with less than 100px of content
            break;
          }
          
          totalPages++;
          tempY += pageHeight;
        }
        
        // Now render each page with correct page numbers
        let currentY = 0;
        let pageNumber = 0;
        
        while (currentY < canvas.height) {
          if (pageNumber > 0) {
            pdf.addPage();
          }
          
          // Calculate the height for this page
          const remainingHeight = canvas.height - currentY;
          const pageHeight = Math.min(maxHeightPerPagePX, remainingHeight);
          
          // Only add page if there's meaningful content, ensure signature space
          if (pageHeight < 100) { // Skip pages with less than 100px of content
            break;
          }
          
          // Re-render template with correct page information for this page
          const pageData = {
            ...invoiceData,
            pageNumber: pageNumber + 1,
            totalPages: totalPages
          };
          
          // Create a fresh container for this page
          const pageContainer = document.createElement('div');
          document.body.appendChild(pageContainer);
          pageContainer.style.cssText = pdfContainer.style.cssText;
          
          const pageRoot = createRoot(pageContainer);
          await new Promise((resolve) => {
            pageRoot.render(React.createElement(Template, { data: pageData }));
            setTimeout(resolve, 300);
          });
          
          // Apply same styling fixes
          const allPageElements = pageContainer.querySelectorAll('*');
          allPageElements.forEach(el => {
            const computed = window.getComputedStyle(el);
            if (computed.position === 'fixed' || computed.position === 'absolute') {
              el.style.position = 'relative';
            }
            if (computed.transform && computed.transform !== 'none') {
              el.style.transform = 'none';
            }
          });
          
          const pageFirstChild = pageContainer.firstElementChild;
          if (pageFirstChild) {
            pageFirstChild.style.cssText += `
              width: 794px !important;
              height: auto !important;
              max-width: none !important;
              max-height: none !important;
              transform: none !important;
              overflow: visible !important;
            `;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Create canvas for this specific page
          const pageCanvas = await html2canvas(pageContainer, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            width: contentWidthPX,
            height: pageHeight,
            backgroundColor: '#ffffff',
          });
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageAspectRatio = pageCanvas.width / pageCanvas.height;
          const pageHeightMM = contentWidthMM / pageAspectRatio;
          
          pdf.addImage(pageImgData, 'PNG', marginMM, marginMM, contentWidthMM, pageHeightMM, undefined, 'FAST');
          
          // Cleanup page container
          pageRoot.unmount();
          document.body.removeChild(pageContainer);
          
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
