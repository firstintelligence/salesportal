import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Index from "./Index";

const InvoiceGeneratorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  const invoiceProfile = location.state?.invoiceProfile;
  const calculatorData = location.state?.calculatorData;

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  // Determine back navigation based on where user came from
  const handleBack = () => {
    if (customer?.id) {
      navigate(`/customer/${customer.id}`);
    } else {
      navigate("/landing");
    }
  };

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
            Invoice Generator
          </h1>
          <div className="w-8 md:w-16" /> {/* Spacer for centering */}
        </div>
      </div>
      <Index preloadedCustomer={customer} preloadedInvoiceProfile={invoiceProfile} preloadedCalculatorData={calculatorData} />
    </div>
  );
};

export default InvoiceGeneratorPage;
