import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileText, Calculator, Phone, CreditCard, DollarSign, Grid2X2, Calendar, TrendingUp, UserCheck, FileEdit, Users } from "lucide-react";
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
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
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
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {agentProfile?.first_name || 'there'}
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Select a tool to get started
            </p>
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
