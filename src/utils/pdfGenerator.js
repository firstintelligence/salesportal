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
      
      // Calculate content area dimensions
      const contentWidthMM = pageWidthMM - (marginMM * 2);
      
      // Use jsPDF's html method to preserve text selectability
      const pdf = new jsPDF('p', 'mm', [pageWidthMM, pageHeightMM]);
      
      await pdf.html(firstChild || pdfContainer, {
        callback: function(doc) {
          // Generate filename in format: "John Smith - 123 Main Street, Toronto, ON A1A 1A1 - GPHJS1234"
          const { number } = invoiceData.invoice;
          const { firstName, lastName, name, address, city, province, postalCode } = invoiceData.billTo;
          
          // Use firstName + lastName if available, otherwise fall back to name
          const customerName = firstName && lastName 
            ? `${firstName} ${lastName}` 
            : name || "Customer";
          
          const fullAddress = `${address}, ${city}, ${province} ${postalCode}`;
          const fileName = `${customerName} - ${fullAddress} - ${number}.pdf`;

          doc.save(fileName);
          
          // Cleanup
          root.unmount();
          document.body.removeChild(pdfContainer);
          resolve();
        },
        x: marginMM,
        y: marginMM,
        width: contentWidthMM,
        windowWidth: contentWidthPX,
        margin: [marginMM, marginMM, marginMM, marginMM],
      });
    } catch (error) {
      reject(error);
    }
  });
};
