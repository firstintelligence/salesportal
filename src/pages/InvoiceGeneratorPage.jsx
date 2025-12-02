import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Index from "./Index";

const InvoiceGeneratorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div>
      <div className="bg-card border-b border-border p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/landing")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tools
        </Button>
      </div>
      <Index preloadedCustomer={customer} />
    </div>
  );
};

export default InvoiceGeneratorPage;
