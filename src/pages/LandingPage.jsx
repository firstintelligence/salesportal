import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, Grid2X2, Calendar, TrendingUp, UserCheck, FileEdit, Users, ChevronRight } from "lucide-react";
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

  // Main tools in sequence
  const baseTools = [
    {
      title: "Appointments",
      subtitle: "View your schedule",
      icon: Calendar,
      path: "/appointments",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Savings Calculator",
      subtitle: "Calculate savings",
      icon: Calculator,
      path: "/savings-calculator",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Payment Calculator",
      subtitle: "Financing options",
      icon: DollarSign,
      path: "/payment-calculator",
      color: "from-violet-500 to-violet-600",
      bgColor: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      title: "Invoice Generator",
      subtitle: "Create invoices",
      icon: FileText,
      path: "/invoice-generator",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Loan Application",
      subtitle: "Apply for financing",
      icon: CreditCard,
      path: "/loan-application",
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
    },
    {
      title: "TPV AI",
      subtitle: "Verification calls",
      icon: Phone,
      path: "/tpv-ai",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Qualify",
      subtitle: "Scan ID for eligibility",
      icon: UserCheck,
      path: "/qualify",
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
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
          color: "from-indigo-500 to-indigo-600",
          bgColor: "bg-indigo-50",
          iconColor: "text-indigo-600",
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
        color: "from-slate-500 to-slate-600",
        bgColor: "bg-slate-100",
        iconColor: "text-slate-600",
      },
    ];
  }

  const tenantLogo = tenant ? getTenantLogo(tenant.slug) : null;
  const companyName = tenant?.name || "Sales Portal";

  // Check if current route is dashboard
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/landing';

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation Bar - Salesforce inspired */}
      <header className="sticky top-0 z-10 bg-[#032D60] shadow-lg px-3 py-2 sm:px-6 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo/Company - Left */}
          <div className="flex items-center gap-2">
            {tenantLogo && (
              <img 
                src={tenantLogo} 
                alt={companyName}
                className="h-6 sm:h-10 object-contain brightness-0 invert"
              />
            )}
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md transition-all duration-200 ${
                isDashboard 
                  ? 'bg-white/20 text-white font-medium' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid2X2 className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
            </Button>
            
            <Button
              onClick={() => navigate("/customers")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Customers</span>
            </Button>
            
            <div className="w-px h-5 bg-white/20 mx-1 hidden sm:block" />
            
            <ProfileDropdown />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {agentProfile?.first_name || 'there'}
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Select a tool to get started
            </p>
          </div>

          {/* Tools Grid - Salesforce card style */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {tools.map((tool) => (
              <div
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className="group cursor-pointer bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Colored top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${tool.color}`} />
                
                <div className="p-4 sm:p-5">
                  {/* Icon */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300`}>
                    <tool.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${tool.iconColor}`} strokeWidth={1.75} />
                  </div>
                  
                  {/* Title & Subtitle */}
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800 leading-tight mb-1 group-hover:text-slate-900">
                    {tool.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-snug">
                    {tool.subtitle}
                  </p>
                  
                  {/* Arrow indicator on hover */}
                  <div className="flex items-center mt-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
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
