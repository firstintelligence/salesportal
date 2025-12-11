import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, ClipboardCheck, LayoutDashboard, Calendar, Trophy } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantLogo } from "@/utils/tenantLogos";

const LandingPage = () => {
  const navigate = useNavigate();
  const { tenant, agentProfile, isSuperAdmin } = useTenant();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  const tools = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      gradient: "from-indigo-500 via-indigo-600 to-blue-700",
      accentColor: "bg-white/20",
    },
    {
      title: "Appointments",
      icon: Calendar,
      path: "/appointments",
      gradient: "from-rose-400 via-pink-500 to-fuchsia-600",
      accentColor: "bg-white/20",
    },
    {
      title: "Stats",
      icon: Trophy,
      path: "/stats",
      gradient: "from-amber-400 via-yellow-500 to-orange-500",
      accentColor: "bg-white/20",
    },
    {
      title: "Savings Calculator",
      icon: Calculator,
      path: "/savings-calculator",
      gradient: "from-emerald-400 via-green-500 to-teal-600",
      accentColor: "bg-white/20",
    },
    {
      title: "Payment Calculator",
      icon: DollarSign,
      path: "/payment-calculator",
      gradient: "from-violet-500 via-purple-600 to-indigo-700",
      accentColor: "bg-white/20",
    },
    {
      title: "Invoice Generator",
      icon: FileText,
      path: "/invoice-generator",
      gradient: "from-cyan-400 via-sky-500 to-blue-600",
      accentColor: "bg-white/20",
    },
    {
      title: "Loan Application",
      icon: CreditCard,
      path: "/loan-application",
      gradient: "from-lime-400 via-green-500 to-emerald-600",
      accentColor: "bg-white/20",
    },
    {
      title: "TPV AI",
      icon: Phone,
      path: "/tpv-ai",
      gradient: "from-red-500 via-rose-600 to-pink-700",
      accentColor: "bg-white/20",
    },
    {
      title: "Installation Checklist",
      icon: ClipboardCheck,
      path: "/installation-checklist",
      gradient: "from-teal-400 via-cyan-500 to-sky-600",
      accentColor: "bg-white/20",
    },
  ];

  const tenantLogo = tenant ? getTenantLogo(tenant.slug) : null;
  const companyName = tenant?.name || "Sales Portal";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14">
          {tenantLogo && (
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
                <img 
                  src={tenantLogo} 
                  alt={companyName}
                  className="h-14 sm:h-18 lg:h-20 object-contain"
                />
              </div>
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-3">
            {companyName}
          </h1>
          
          {agentProfile && (
            <p className="text-lg sm:text-xl font-medium text-foreground/80 mb-1">
              Welcome, {agentProfile.first_name}
            </p>
          )}
          
          <p className="text-sm sm:text-base text-muted-foreground">
            Select a tool to get started
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {tools.map((tool) => (
            <div
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className={`
                group relative cursor-pointer rounded-2xl overflow-hidden
                bg-gradient-to-br ${tool.gradient}
                shadow-lg
                transition-all duration-300 ease-out
                hover:scale-[1.04] hover:-translate-y-2
                hover:shadow-2xl
                active:scale-[0.97]
                aspect-square
              `}
            >
              {/* Large background icon */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.15] transition-all duration-500 group-hover:opacity-25 group-hover:scale-110">
                <tool.icon className="w-32 h-32 sm:w-36 sm:h-36 text-white" strokeWidth={1} />
              </div>
              
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-4 sm:p-5">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${tool.accentColor} backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
                </div>
                
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-md">
                  {tool.title}
                </h2>
              </div>
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
