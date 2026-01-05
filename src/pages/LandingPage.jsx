import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, ClipboardCheck, Grid2X2, Calendar, Trophy } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantLogo } from "@/utils/tenantLogos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProfileDropdown from "@/components/ProfileDropdown";

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
  
  console.log('Tenant data:', tenant);
  console.log('Tenant slug:', tenant?.slug);
  console.log('Tenant logo result:', tenantLogo);

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
              <img 
                src={tenantLogo} 
                alt={companyName}
                className="h-10 sm:h-12 object-contain"
              />
            )}
          </div>
          
          {/* Right side controls - consistent button styles */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dashboard */}
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            >
              <Grid2X2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
            </Button>
            
            {/* Stats */}
            <Button
              onClick={() => navigate("/stats")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Stats</span>
            </Button>
            
            {/* Profile dropdown with tenant switcher inside */}
            <ProfileDropdown />
          </div>
        </div>
      </header>
      
      <div className="relative px-4 pb-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12 pt-6 sm:pt-8 lg:pt-10">
            {agentProfile && (
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Welcome back, {agentProfile.first_name}
              </p>
            )}
            <p className="text-sm sm:text-base text-muted-foreground">
              Select a tool to get started
            </p>
          </div>

          {/* Tools Grid - Main Focus */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 opacity-[0.08] pointer-events-none">
                  <tool.icon className="w-full h-full" strokeWidth={1} />
                </div>
                
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className={`p-2.5 sm:p-3 rounded-xl ${tool.iconBg} shadow-lg w-fit mb-3 sm:mb-4`}>
                    <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground tracking-tight leading-tight">
                    {tool.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-1.5">
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
