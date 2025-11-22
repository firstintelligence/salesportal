import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Calculator, Bot } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  const tools = [
    {
      title: "Invoice Generator",
      icon: FileText,
      description: "Create professional invoices and quotes",
      path: "/invoice-generator",
    },
    {
      title: "Savings Calculator",
      icon: Calculator,
      description: "Calculate potential savings",
      path: "/savings-calculator",
    },
    {
      title: "TPV AI",
      icon: Bot,
      description: "AI-powered third-party verification",
      path: "/tpv-ai",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Georges Plumbing & Heating
          </h1>
          <p className="text-xl text-muted-foreground">
            Select a tool to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.path}
              className="bg-card border border-border rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <tool.icon className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {tool.title}
                </h2>
                <p className="text-muted-foreground">{tool.description}</p>
                <Button
                  onClick={() => navigate(tool.path)}
                  className="w-full mt-4"
                >
                  Open Tool
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
