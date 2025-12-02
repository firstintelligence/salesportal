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
