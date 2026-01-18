import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, ClipboardCheck, Grid2X2, Calendar, Trophy, Shield, TrendingUp, UserCheck, FileEdit } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantLogo, getTenantLogoSize } from "@/utils/tenantLogos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProfileDropdown from "@/components/ProfileDropdown";

// Super admin ID
const SUPER_ADMIN_ID = 'MM231611';
// Agents who can see profit calculator
const PROFIT_CALC_AGENTS = ['MM231611', 'WA4929'];
const LandingPage = () => {
  const navigate = useNavigate();
  const { tenant, agentProfile, isSuperAdmin } = useTenant();
  const agentId = localStorage.getItem('agentId');
  const isSuperAdminUser = agentId === SUPER_ADMIN_ID;
  const canSeeProfitCalc = PROFIT_CALC_AGENTS.includes(agentId);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  // Main tools in sequence (Installation Checklist removed - part of process flow)
  const baseTools = [
    {
      title: "Appointments",
      subtitle: "View your schedule",
      icon: Calendar,
      path: "/appointments",
    },
    {
      title: "Savings Calculator",
      subtitle: "Calculate savings",
      icon: Calculator,
      path: "/savings-calculator",
    },
    {
      title: "Payment Calculator",
      subtitle: "Financing options",
      icon: DollarSign,
      path: "/payment-calculator",
    },
    {
      title: "Invoice Generator",
      subtitle: "Create invoices",
      icon: FileText,
      path: "/invoice-generator",
    },
    {
      title: "Loan Application",
      subtitle: "Apply for financing",
      icon: CreditCard,
      path: "/loan-application",
    },
    {
      title: "TPV AI",
      subtitle: "Verification calls",
      icon: Phone,
      path: "/tpv-ai",
    },
    {
      title: "Qualify",
      subtitle: "Scan ID for eligibility",
      icon: UserCheck,
      path: "/qualify",
    },
  ];

  // Add profit calculator tile if user has permission
  let tools = canSeeProfitCalc 
    ? [
        ...baseTools,
        {
          title: "Profit Calculator",
          subtitle: "Analyze deal margins",
          icon: TrendingUp,
          path: "/profit-calculator",
        },
      ]
    : baseTools;

  // Add Custom Invoice V2 tile for super admin only
  if (isSuperAdminUser) {
    tools = [
      ...tools,
      {
        title: "Custom Invoice V2",
        subtitle: "Super Admin Only",
        icon: FileEdit,
        path: "/custom-invoice-v2",
      },
    ];
  }

  const tenantLogo = tenant ? getTenantLogo(tenant.slug) : null;
  const tenantLogoSize = tenant ? getTenantLogoSize(tenant.slug, 'header') : 'h-10 sm:h-12';
  const companyName = tenant?.name || "Sales Portal";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo/Company - Left */}
          <div className="flex items-center gap-3">
            {tenantLogo && (
              <img 
                src={tenantLogo} 
                alt={companyName}
                className={`${tenantLogoSize} object-contain`}
              />
            )}
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              onClick={() => navigate("/customers")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Grid2X2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Customers</span>
            </Button>
            
            <Button
              onClick={() => navigate("/stats")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Stats</span>
            </Button>
            
            {isSuperAdminUser && (
              <Button
                onClick={() => navigate("/signing-certificates")}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm font-medium hidden sm:inline">Certificates</span>
              </Button>
            )}
            
            <ProfileDropdown />
          </div>
        </div>
      </header>
      
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Simple header */}
          <p className="text-muted-foreground mb-6 sm:mb-8">
            Select a tool to get started
          </p>

          {/* Clean Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {tools.map((tool) => (
              <Card
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className="group cursor-pointer border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
                    <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={2} />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-foreground leading-tight">
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
    </div>
  );
};

export default LandingPage;
