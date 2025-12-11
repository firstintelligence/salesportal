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
      bgColor: "bg-gradient-to-br from-slate-800 to-slate-900",
      iconBg: "bg-slate-600",
      iconColor: "text-white",
      hoverRing: "hover:ring-slate-400",
    },
    {
      title: "Appointments",
      icon: Calendar,
      path: "/appointments",
      bgColor: "bg-gradient-to-br from-violet-600 to-purple-800",
      iconBg: "bg-violet-400",
      iconColor: "text-white",
      hoverRing: "hover:ring-violet-400",
    },
    {
      title: "Stats",
      icon: Trophy,
      path: "/stats",
      bgColor: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconBg: "bg-amber-300",
      iconColor: "text-amber-900",
      hoverRing: "hover:ring-amber-400",
    },
    {
      title: "Savings Calculator",
      icon: Calculator,
      path: "/savings-calculator",
      bgColor: "bg-gradient-to-br from-emerald-500 to-teal-700",
      iconBg: "bg-emerald-300",
      iconColor: "text-emerald-900",
      hoverRing: "hover:ring-emerald-400",
    },
    {
      title: "Payment Calculator",
      icon: DollarSign,
      path: "/payment-calculator",
      bgColor: "bg-gradient-to-br from-pink-500 to-rose-700",
      iconBg: "bg-pink-300",
      iconColor: "text-pink-900",
      hoverRing: "hover:ring-pink-400",
    },
    {
      title: "Invoice Generator",
      icon: FileText,
      path: "/invoice-generator",
      bgColor: "bg-gradient-to-br from-blue-500 to-indigo-700",
      iconBg: "bg-blue-300",
      iconColor: "text-blue-900",
      hoverRing: "hover:ring-blue-400",
    },
    {
      title: "Loan Application",
      icon: CreditCard,
      path: "/loan-application",
      bgColor: "bg-gradient-to-br from-fuchsia-500 to-purple-700",
      iconBg: "bg-fuchsia-300",
      iconColor: "text-fuchsia-900",
      hoverRing: "hover:ring-fuchsia-400",
    },
    {
      title: "TPV AI",
      icon: Phone,
      path: "/tpv-ai",
      bgColor: "bg-gradient-to-br from-orange-500 to-red-600",
      iconBg: "bg-orange-300",
      iconColor: "text-orange-900",
      hoverRing: "hover:ring-orange-400",
    },
    {
      title: "Installation Checklist",
      icon: ClipboardCheck,
      path: "/installation-checklist",
      bgColor: "bg-gradient-to-br from-cyan-500 to-blue-700",
      iconBg: "bg-cyan-300",
      iconColor: "text-cyan-900",
      hoverRing: "hover:ring-cyan-400",
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
                group relative cursor-pointer rounded-2xl p-5 sm:p-6
                ${tool.bgColor}
                shadow-lg shadow-slate-300/30 dark:shadow-slate-900/50
                ring-2 ring-transparent ${tool.hoverRing}
                transition-all duration-300 ease-out
                hover:scale-[1.03] hover:-translate-y-1.5
                hover:shadow-xl
                active:scale-[0.97]
              `}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-xl ${tool.iconBg} shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <tool.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${tool.iconColor}`} />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-white leading-tight drop-shadow-sm">
                  {tool.title}
                </h2>
              </div>
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
