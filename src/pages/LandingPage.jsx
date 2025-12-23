import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, ClipboardCheck, LayoutDashboard, Calendar, Trophy, ChevronRight } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantLogo } from "@/utils/tenantLogos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  // Main tools in sequence
  const tools = [
    {
      title: "Appointments",
      subtitle: "View your schedule",
      icon: Calendar,
      path: "/appointments",
      gradient: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30",
      iconBg: "bg-rose-500",
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
    <div className="min-h-screen bg-background">
      {/* Decorative background */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent dark:from-primary/5 dark:via-purple-500/3 pointer-events-none" />
      
      {/* Top Navigation Bar */}
      <header className="relative z-10 px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo/Company - Left */}
          <div className="flex items-center gap-3">
            {tenantLogo && (
              <div className="p-2 glass-effect rounded-xl shadow-md bg-transparent">
                <img 
                  src={tenantLogo} 
                  alt={companyName}
                  className="h-8 sm:h-10 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            )}
          </div>
          
          {/* Stats/Trophy Button - Right */}
          <Button
            onClick={() => navigate("/stats")}
            variant="ghost"
            size="sm"
            className="relative group p-2 sm:p-3 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-800/50 dark:hover:to-orange-800/40 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
          </Button>
        </div>
      </header>
      
      <div className="relative px-4 pb-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10 pt-4 sm:pt-6">
            {agentProfile && (
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
                Welcome back, {agentProfile.first_name}
              </p>
            )}
            <p className="text-sm sm:text-base text-muted-foreground">
              Select a tool to get started
            </p>
          </div>

          {/* Dashboard Card - Prominent, separate from tools */}
          <Card
            onClick={() => navigate("/dashboard")}
            className="relative overflow-hidden border-0 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 dark:from-indigo-600 dark:via-violet-600 dark:to-purple-700 mb-6 sm:mb-8 lg:mb-10"
          >
            {/* Large background icon */}
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 opacity-10 pointer-events-none translate-x-4 -translate-y-4">
              <LayoutDashboard className="w-full h-full text-white" strokeWidth={1} />
            </div>
            
            <CardContent className="p-5 sm:p-6 lg:p-8 flex items-center justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="p-3 sm:p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    Dashboard
                  </h2>
                  <p className="text-sm sm:text-base text-white/80 mt-0.5">
                    Manage your deals & customers
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white/60 group-hover:text-white transition-colors" />
            </CardContent>
          </Card>

          {/* Section Label */}
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Sales Tools
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {tools.map((tool, index) => (
              <Card
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className={`
                  relative overflow-hidden border-0 cursor-pointer
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 ease-out
                  hover:scale-[1.03] hover:-translate-y-1
                  active:scale-[0.97]
                  ${tool.gradient}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Large background icon - top right corner */}
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 opacity-[0.08] pointer-events-none">
                  <tool.icon className="w-full h-full" strokeWidth={1} />
                </div>
                
                <CardContent className="p-3 sm:p-4 lg:p-5">
                  <div className={`p-2 sm:p-2.5 rounded-xl ${tool.iconBg} shadow-lg w-fit mb-2 sm:mb-3`}>
                    <tool.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground tracking-tight leading-tight">
                    {tool.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                    {tool.subtitle}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
