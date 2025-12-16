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
    <div>
      <div className="bg-card border-b border-border p-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {customer?.id ? 'Back to Customer' : 'Back to Tools'}
        </Button>
      </div>
      <Index preloadedCustomer={customer} preloadedInvoiceProfile={invoiceProfile} preloadedCalculatorData={calculatorData} />
    </div>
  );
};

export default InvoiceGeneratorPage;
