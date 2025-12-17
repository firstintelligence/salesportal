import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, ClipboardCheck, LayoutDashboard, Calendar, Trophy } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantLogo } from "@/utils/tenantLogos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      subtitle: "Manage your deals",
      icon: LayoutDashboard,
      path: "/dashboard",
      gradient: "bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30",
      iconBg: "bg-indigo-500",
    },
    {
      title: "Appointments",
      subtitle: "View your schedule",
      icon: Calendar,
      path: "/appointments",
      gradient: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30",
      iconBg: "bg-rose-500",
    },
    {
      title: "Stats",
      subtitle: "Track performance",
      icon: Trophy,
      path: "/stats",
      gradient: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30",
      iconBg: "bg-amber-500",
    },
    {
      title: "Savings Calculator",
      subtitle: "Calculate savings",
      icon: Calculator,
      path: "/savings-calculator",
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30",
      iconBg: "bg-emerald-500",
    },
    {
      title: "Payment Calculator",
      subtitle: "Financing options",
      icon: DollarSign,
      path: "/payment-calculator",
      gradient: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30",
      iconBg: "bg-violet-500",
    },
    {
      title: "Invoice Generator",
      subtitle: "Create invoices",
      icon: FileText,
      path: "/invoice-generator",
      gradient: "bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/40 dark:to-sky-950/30",
      iconBg: "bg-cyan-500",
    },
    {
      title: "Loan Application",
      subtitle: "Apply for financing",
      icon: CreditCard,
      path: "/loan-application",
      gradient: "bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-950/40 dark:to-green-950/30",
      iconBg: "bg-lime-600",
    },
    {
      title: "TPV AI",
      subtitle: "Verification calls",
      icon: Phone,
      path: "/tpv-ai",
      gradient: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30",
      iconBg: "bg-red-500",
    },
    {
      title: "Installation Checklist",
      subtitle: "Document installs",
      icon: ClipboardCheck,
      path: "/installation-checklist",
      gradient: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/30",
      iconBg: "bg-teal-500",
    },
  ];

  const tenantLogo = tenant ? getTenantLogo(tenant.slug) : null;
  const companyName = tenant?.name || "Sales Portal";

  return (
    <div className="min-h-screen bg-background p-4 pt-8 sm:p-6 lg:p-8">
      {/* Decorative background */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent dark:from-primary/5 dark:via-purple-500/3 pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14">
          {tenantLogo ? (
            <div className="flex justify-center mb-6">
              <div className="p-4 glass-effect rounded-2xl shadow-xl bg-transparent">
                <img 
                  src={tenantLogo} 
                  alt={companyName}
                  className="h-14 sm:h-16 lg:h-20 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            </div>
          ) : (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-3">
              {companyName}
            </h1>
          )}
          
          {agentProfile && (
            <p className="text-xl sm:text-2xl font-semibold text-foreground/80 mb-2">
              Welcome back, {agentProfile.first_name}
            </p>
          )}
          
          <p className="text-sm sm:text-base text-muted-foreground">
            Select a tool to get started
          </p>
        </div>

        {/* Tools Grid - StatCard Style */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {tools.map((tool, index) => (
            <Card
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className={`
                relative overflow-hidden border-0 cursor-pointer
                shadow-lg hover:shadow-xl
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:-translate-y-1
                active:scale-[0.98]
                ${tool.gradient}
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Large background icon - top right corner */}
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 opacity-[0.08] pointer-events-none">
                <tool.icon className="w-full h-full" strokeWidth={1} />
              </div>
              
              <CardHeader className="pb-2 pt-4 sm:pt-5">
                <CardTitle className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${tool.iconBg} shadow-lg`}>
                    <tool.icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pb-4 sm:pb-5">
                <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                  {tool.title}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {tool.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
