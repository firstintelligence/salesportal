import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, Grid2X2, Calendar, Trophy, TrendingUp, UserCheck, FileEdit, Users } from "lucide-react";
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
  const location = useLocation();
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

  // Check if current route is dashboard
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/landing';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm px-4 py-3 sm:px-6 lg:px-8">
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
          
          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${
                isDashboard 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Grid2X2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
            </Button>
            
            <Button
              onClick={() => navigate("/customers")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Customers</span>
            </Button>
            
            <Button
              onClick={() => navigate("/stats")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Stats</span>
            </Button>
            
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
            
            <ProfileDropdown />
          </div>
        </div>
      </header>
      
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header section */}
          <div className="mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Welcome back
            </h1>
            <p className="text-slate-500">
              Select a tool to get started
            </p>
          </div>

          {/* Enhanced Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {tools.map((tool, index) => (
              <Card
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className="group cursor-pointer bg-white border border-slate-200/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 w-fit mb-4 group-hover:from-primary/15 group-hover:to-primary/10 transition-colors duration-300">
                    <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={1.75} />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 leading-tight group-hover:text-primary transition-colors duration-200">
                    {tool.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
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
