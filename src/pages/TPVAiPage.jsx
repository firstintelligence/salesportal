import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import TPVRequest from "@/components/tpv/TPVRequest";

const TPVAiPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  return <TPVRequest onBack={() => navigate("/landing")} />;
};

export default TPVAiPage;
