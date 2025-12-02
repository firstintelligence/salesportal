import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import TPVRequest from "@/components/tpv/TPVRequest";

const TPVAiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  return <TPVRequest onBack={() => navigate("/landing")} preloadedCustomer={customer} />;
};

export default TPVAiPage;
