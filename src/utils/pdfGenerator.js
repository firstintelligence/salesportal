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
      
      invoice.innerHTML = invoiceHTML;
      
      // 0.25 inches = 6.35mm margins all around
      const margin = 6.35;
      // US Letter size: 8.5" x 11" = 215.9mm x 279.4mm
      const pageWidth = 215.9;
      const pageHeight = 279.4;
      const contentWidth = pageWidth - (2 * margin); // 203.2mm
      const contentHeight = pageHeight - (2 * margin); // 266.7mm
      
      invoice.style.width = `${contentWidth}mm`;
      invoice.style.height = `${contentHeight}mm`;
      invoice.style.padding = '0';
      invoice.style.margin = '0';
      invoice.style.boxSizing = 'border-box';
      
      const canvas = await html2canvas(invoice, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [pageWidth, pageHeight]); // US Letter size
      
      // Add the content with margins
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');
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
