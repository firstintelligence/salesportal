import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TPVRequest from "@/components/tpv/TPVRequest";

const TPVAiPage = () => {
  const navigate = useNavigate();
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  if (showRequest) {
    return <TPVRequest onBack={() => setShowRequest(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
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
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">TPV Request System</h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Submit verification calls for payment details
          </p>
          <Button size="lg" onClick={() => setShowRequest(true)}>
            Create TPV Request
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TPVAiPage;
