import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (invoiceData, templateNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoice = document.createElement('div');
      document.body.appendChild(invoice);
      
      // Render the InvoiceTemplate component to a string
      const InvoiceTemplate = (await import('../components/InvoiceTemplate')).default;
      const ReactDOMServer = (await import('react-dom/server')).default;
      const React = (await import('react')).default;
      
      const invoiceElement = React.createElement(InvoiceTemplate, { data: invoiceData, templateNumber });
      const invoiceHTML = ReactDOMServer.renderToString(invoiceElement);
      
      // US Letter size: 8.5" x 11" = 215.9mm x 279.4mm
      // 0.25 inches = 6.35mm margins all around
      const pageWidthMM = 215.9;
      const pageHeightMM = 279.4;
      const marginMM = 6.35; // 0.25 inches
      const contentWidthMM = pageWidthMM - (marginMM * 2);
      const contentHeightMM = pageHeightMM - (marginMM * 2);
      
      // Create a container that represents just the content area (without margins)
      invoice.style.width = `${contentWidthMM}mm`;
      invoice.style.height = `${contentHeightMM}mm`;
      invoice.style.backgroundColor = 'white';
      invoice.style.position = 'absolute';
      invoice.style.top = '-9999px'; // Hide off-screen
      invoice.style.left = '-9999px';
      invoice.style.fontFamily = 'Arial, sans-serif';
      invoice.style.overflow = 'hidden';
      invoice.style.padding = '0';
      invoice.style.margin = '0';
      invoice.style.boxSizing = 'border-box';
      
      // Add the content
      invoice.innerHTML = invoiceHTML;
      
      // Wait for any fonts/images to load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const canvas = await html2canvas(invoice, {
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
      
      document.body.removeChild(invoice);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
