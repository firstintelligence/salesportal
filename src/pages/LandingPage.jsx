import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  const tools = [
    {
      title: "Savings Calculator",
      icon: Calculator,
      description: "Calculate potential savings",
      path: "/savings-calculator",
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
    },
    {
      title: "Payment Calculator",
      icon: DollarSign,
      description: "Calculate installment estimates",
      path: "/payment-calculator",
      gradient: "from-pink-500/20 to-rose-500/20",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-600",
    },
    {
      title: "Invoice Generator",
      icon: FileText,
      description: "Create professional invoices and quotes",
      path: "/invoice-generator",
      gradient: "from-blue-500/20 to-indigo-500/20",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      title: "Loan Application",
      icon: CreditCard,
      description: "Complete financing application form",
      path: "/loan-application",
      gradient: "from-violet-500/20 to-purple-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600",
    },
    {
      title: "TPV AI",
      icon: Phone,
      description: "Third-party verification calls",
      path: "/tpv-request",
      gradient: "from-orange-500/20 to-amber-500/20",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-foreground tracking-tight">
            George's Plumbing & Heating
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Select a tool to get started
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {tools.map((tool) => (
            <div
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className={`
                group relative cursor-pointer rounded-2xl p-4 sm:p-5 lg:p-6
                bg-gradient-to-br ${tool.gradient}
                backdrop-blur-sm border border-border/50
                shadow-sm hover:shadow-lg
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:-translate-y-1
                active:scale-[0.98]
              `}
            >
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                <div className={`p-3 sm:p-4 rounded-xl ${tool.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <tool.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${tool.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground leading-tight">
                    {tool.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                    {tool.description}
                  </p>
                </div>
              </div>
              
              {/* Subtle hover indicator */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover:ring-primary/20 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
