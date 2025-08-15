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
      const marginMM = 6.35;
      
      // Create a container that represents the full page with margins
      invoice.style.width = `${pageWidthMM}mm`;
      invoice.style.height = `${pageHeightMM}mm`;
      invoice.style.padding = `${marginMM}mm`;
      invoice.style.boxSizing = 'border-box';
      invoice.style.backgroundColor = 'white';
      invoice.style.position = 'absolute';
      invoice.style.top = '-9999px'; // Hide off-screen
      invoice.style.left = '-9999px';
      
      // Add the content
      invoice.innerHTML = invoiceHTML;
      
      // Wait for any fonts/images to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(invoice, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: pageWidthMM * 3.78, // Convert mm to pixels (96 DPI)
        height: pageHeightMM * 3.78,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [pageWidthMM, pageHeightMM]); // US Letter size
      
      // Add the full page image (which already includes the margins)
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMM, pageHeightMM, undefined, 'FAST');
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
