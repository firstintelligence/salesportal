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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">TPV Request System</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Submit verification calls for payment details
        </p>
        <Button asChild size="lg">
          <Link to="/tpv-request">Create TPV Request</Link>
        </Button>
      </div>
    </div>
  );
};

export default TPVAiPage;
