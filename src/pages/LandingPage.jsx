import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, DollarSign, Grid2X2, Calendar, TrendingUp, FileEdit, Users, ScanLine } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantLogo, getTenantLogoSize } from "@/utils/tenantLogos";
import { Button } from "@/components/ui/button";
import ProfileDropdown from "@/components/ProfileDropdown";

// Super admin ID
const SUPER_ADMIN_ID = 'MM231611';
// Agents who can see profit calculator
const PROFIT_CALC_AGENTS = ['MM231611', 'WA4929'];

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, agentProfile, isSuperAdmin, isImpersonating } = useTenant();
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

  // Main tools in ROYGBIV spectrum order
  const baseTools = [
    {
      title: "Appointments",
      subtitle: "View your schedule",
      icon: Calendar,
      path: "/appointments",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Calculator",
      subtitle: "Payments & Savings",
      icon: Calculator,
      path: "/calculator",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Documents",
      subtitle: "Invoices & Loan Apps",
      icon: FileText,
      path: "/documents",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      title: "TPV AI",
      subtitle: "Verification calls",
      icon: Phone,
      path: "/tpv-ai",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  // Add profit calculator tile if user has permission (Blue in spectrum)
  let tools = canSeeProfitCalc 
    ? [
        ...baseTools,
        {
          title: "Profit Calculator",
          subtitle: "Analyze deal margins",
          icon: TrendingUp,
          path: "/profit-calculator",
          color: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
        },
      ]
    : baseTools;

  // Add Custom Invoice V2 tile for super admin only (Indigo/Violet in spectrum)
  if (isSuperAdminUser) {
    tools = [
      ...tools,
      {
        title: "Custom Invoice V2",
        subtitle: "Super Admin Only",
        icon: FileEdit,
        path: "/custom-invoice-v2",
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-50",
        iconColor: "text-indigo-600",
      },
    ];
  }

  const tenantLogo = tenant ? getTenantLogo(tenant.slug) : null;
  const companyName = tenant?.name || "Sales Portal";

  // Check if current route is dashboard
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/landing';

  return (
    <div className={`min-h-screen bg-slate-100 ${isImpersonating ? 'pt-9' : ''}`}>
      {/* Top Navigation Bar */}
      <header className={`sticky ${isImpersonating ? 'top-9' : 'top-0'} z-10 bg-white shadow-sm border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo/Company - Left */}
          <div className="flex items-center gap-2">
            {tenantLogo && (
              <img 
                src={tenantLogo} 
                alt={companyName}
                className="h-7 sm:h-10 object-contain"
              />
            )}
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-1.5">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                isDashboard 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Grid2X2 className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
            </Button>
            
            <Button
              onClick={() => navigate("/customers")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Customers</span>
            </Button>
            
            <div className="w-px h-6 bg-slate-200 mx-0.5 sm:mx-1" />
            
            <ProfileDropdown />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {agentProfile?.first_name || 'there'}
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Select a tool to get started
            </p>
          </div>
          
          {/* Scan ID CTA Button - Mobile Only */}
          <div className="mb-4 sm:hidden">
            <Button
              onClick={() => navigate("/qualify")}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold text-base shadow-lg flex items-center justify-center gap-2"
            >
              <ScanLine className="h-5 w-5" />
              Scan ID
            </Button>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {tools.map((tool) => (
              <div
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className="group cursor-pointer bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden active:scale-[0.98]"
              >
                {/* Colored top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${tool.color}`} />
                
                <div className="p-4 sm:p-5">
                  {/* Icon */}
                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl ${tool.bgColor} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300`}>
                    <tool.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${tool.iconColor}`} strokeWidth={1.5} />
                  </div>
                  
                  {/* Title & Subtitle */}
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800 leading-tight mb-1.5 group-hover:text-slate-900">
                    {tool.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {tool.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
