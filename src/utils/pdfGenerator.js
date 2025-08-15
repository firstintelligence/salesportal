import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (invoiceData, templateNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Find the existing template element in the DOM instead of rendering to string
      const existingTemplate = document.querySelector('[data-template-preview]');
      if (!existingTemplate) {
        throw new Error('Template preview not found');
      }

      // Clone the existing element to avoid modifying the original
      const templateClone = existingTemplate.cloneNode(true);
      
      // US Letter size: 8.5" x 11" = 215.9mm x 279.4mm
      // 0.25 inches = 6.35mm margins all around
      const pageWidthMM = 215.9;
      const pageHeightMM = 279.4;
      const marginMM = 6.35; // 0.25 inches
      const contentWidthMM = pageWidthMM - (marginMM * 2);
      const contentHeightMM = pageHeightMM - (marginMM * 2);
      
      // Create a wrapper for PDF generation with proper sizing
      const pdfWrapper = document.createElement('div');
      pdfWrapper.style.position = 'absolute';
      pdfWrapper.style.top = '-9999px';
      pdfWrapper.style.left = '-9999px';
      pdfWrapper.style.width = `${contentWidthMM}mm`;
      pdfWrapper.style.height = `${contentHeightMM}mm`;
      pdfWrapper.style.backgroundColor = 'white';
      pdfWrapper.style.overflow = 'hidden';
      pdfWrapper.style.padding = '20px';
      pdfWrapper.style.boxSizing = 'border-box';
      pdfWrapper.style.fontFamily = 'Arial, sans-serif';
      
      // Style the cloned template for PDF
      templateClone.style.width = '100%';
      templateClone.style.height = '100%';
      templateClone.style.transform = 'scale(0.8)';
      templateClone.style.transformOrigin = 'top left';
      templateClone.style.overflow = 'hidden';
      
      pdfWrapper.appendChild(templateClone);
      document.body.appendChild(pdfWrapper);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(pdfWrapper, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: contentWidthMM * 3.78, // Convert mm to pixels (96 DPI)
        height: contentHeightMM * 3.78,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [pageWidthMM, pageHeightMM]); // US Letter size
      
      // Add the content image with proper margins
      pdf.addImage(imgData, 'PNG', marginMM, marginMM, contentWidthMM, contentHeightMM, undefined, 'FAST');
      const { number, date, paymentDate } = invoiceData.invoice;
      const { name: companyName } = invoiceData.yourCompany;
      const { name: billToName } = invoiceData.billTo;
      const timestamp = new Date().getTime();

      let fileName;
      switch (templateNumber) {
        case 1:
          fileName = `${number}.pdf`;
          break;
        case 2:
          fileName = `${companyName}_${number}.pdf`;
          break;
        case 3:
          fileName = `${companyName}.pdf`;
          break;
        case 4:
          fileName = `${date}.pdf`;
          break;
        case 5:
          fileName = `${number}-${date}.pdf`;
          break;
        case 6:
          fileName = `invoice_${timestamp}.pdf`;
          break;
        case 7:
          fileName = `Invoice_${number}.pdf`;
          break;
        case 8:
          fileName = `Invoice_${billToName}.pdf`;
          break;
        case 9:
          fileName = `IN-${date}.pdf`;
          break;
        default:
          fileName = `invoice_template_${templateNumber}.pdf`;
      }

      pdf.save(fileName);
      
      document.body.removeChild(pdfWrapper);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
