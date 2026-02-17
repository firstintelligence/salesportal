import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import TPVRequest from "@/components/tpv/TPVRequest";

const TPVAiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  const calculatorData = location.state?.calculatorData;

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  return <TPVRequest onBack={() => navigate(-1)} preloadedCustomer={customer} preloadedCalculatorData={calculatorData} />;
};

export default TPVAiPage;
