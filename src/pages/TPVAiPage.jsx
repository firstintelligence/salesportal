import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const TPVAiPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  // Redirect directly to the TPV request form
  useEffect(() => {
    navigate("/tpv-request");
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to TPV Request Form...</p>
      </div>
    </div>
  );
};

export default TPVAiPage;
