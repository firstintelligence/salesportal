import React, { useEffect, useState } from 'react';
import InvoiceTemplate from '../components/InvoiceTemplate';

const InvoiceRenderPage = () => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [templateNumber, setTemplateNumber] = useState(1);

  useEffect(() => {
    // Listen for data injection from Puppeteer
    const handleDataReady = () => {
      const data = window.__INVOICE_DATA__;
      const template = window.__INVOICE_TEMPLATE__;
      
      if (data && template) {
        setInvoiceData(data);
        setTemplateNumber(template);
        
        // Signal that rendering is complete
        setTimeout(() => {
          window.__INVOICE_RENDERED__ = true;
        }, 500);
      }
    };

    window.addEventListener('invoice-data-ready', handleDataReady);
    
    // Check if data is already available
    if (window.__INVOICE_DATA__) {
      handleDataReady();
    }

    return () => {
      window.removeEventListener('invoice-data-ready', handleDataReady);
    };
  }, []);

  if (!invoiceData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'white'
      }}>
        Loading invoice...
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'white',
      minHeight: '100vh',
      padding: 0,
      margin: 0
    }}>
      <InvoiceTemplate data={invoiceData} templateNumber={templateNumber} />
    </div>
  );
};

export default InvoiceRenderPage;