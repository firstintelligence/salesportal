import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import InvoiceTemplate from '../components/InvoiceTemplate';
import { generatePDF } from '../utils/pdfGenerator';
import { templates } from '../utils/templateRegistry';
import { useTenant } from "@/contexts/TenantContext";

const TemplatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [formData, setFormData] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (location.state && location.state.formData) {
      setFormData(location.state.formData);
      setCurrentTemplate(location.state.selectedTemplate || 1);
    } else {
      // If no form data in location state, try to load from localStorage
      const savedFormData = localStorage.getItem('formData');
      if (savedFormData) {
        setFormData(JSON.parse(savedFormData));
      }
    }
  }, [location.state]);

  const handleTemplateChange = (templateNumber) => {
    setCurrentTemplate(templateNumber);
  };

  const handleDownloadPDF = async () => {
    if (formData && !isDownloading) {
      setIsDownloading(true);
      try {
        // Build signing context for document signature recording
        const signingContext = {
          documentType: formData.isInvoice ? 'invoice' : 'quote',
          documentId: crypto.randomUUID(),
          customerId: formData.customerId || location.state?.customerId || null,
          customerName: `${formData.billTo?.firstName || ''} ${formData.billTo?.lastName || ''}`.trim(),
          agentId: localStorage.getItem('agentId') || 'unknown',
          tenantId: tenant?.id || null,
          signatureType: 'customer'
        };
        
        // Only super admins see the signing location stamp on the PDF
        const agentId = localStorage.getItem('agentId');
        const isSuperAdmin = agentId === 'MM23';
        await generatePDF(formData, currentTemplate, tenant?.slug || 'georges', signingContext, { isSuperAdmin });
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            {formData?.isInvoice ? 'Invoice Preview' : 'Quote Preview'}
          </h1>
          <Button size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Downloading...</span>
              </>
            ) : (
              "Download PDF"
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex justify-center" data-template-preview>
          <div className="bg-white border shadow-sm">
            <InvoiceTemplate data={formData} templateNumber={currentTemplate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePage;
