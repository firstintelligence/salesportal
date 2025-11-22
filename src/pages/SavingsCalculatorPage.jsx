import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SavingsCalculatorPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

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
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4 text-foreground">
          Savings Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculator content will be added here.
        </p>
      </div>
    </div>
  );
};

export default SavingsCalculatorPage;
