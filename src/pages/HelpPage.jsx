import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Calendar, Calculator, FileText, Phone, TrendingUp, Users, ScanLine, HelpCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileDropdown from "@/components/ProfileDropdown";
import { useTenant } from "@/contexts/TenantContext";

const HelpPage = () => {
  const navigate = useNavigate();
  const { agentProfile } = useTenant();

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
    window.scrollTo(0, 0);
  }, [navigate]);

  const sections = [
    {
      icon: Calendar,
      color: "text-red-600",
      bg: "bg-red-50",
      title: "Appointments",
      description: "View and manage your upcoming appointments synced from your calendar.",
      steps: [
        "Navigate to Appointments from the Dashboard",
        "View your scheduled appointments for the day",
        "Tap on an appointment to see customer details",
      ],
    },
    {
      icon: Calculator,
      color: "text-orange-600",
      bg: "bg-orange-50",
      title: "Calculator",
      description: "Calculate monthly payments, savings estimates, and financing options for customers.",
      steps: [
        "Select the calculator type: Payment or Savings",
        "Enter the product details and pricing",
        "Review the calculated monthly payments or energy savings",
        "Share results with your customer",
      ],
    },
    {
      icon: FileText,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      title: "Documents",
      description: "Create invoices, loan applications, and other documents for your deals.",
      steps: [
        "Choose the document type you need (Invoice, Loan App, etc.)",
        "Fill in the customer and product information",
        "Review the document before generating",
        "Generate the PDF and share with the customer for signing",
      ],
    },
    {
      icon: Phone,
      color: "text-green-600",
      bg: "bg-green-50",
      title: "TPV AI",
      description: "Initiate automated third-party verification calls to confirm deals with customers.",
      steps: [
        "Fill in the customer's name, phone, and address",
        "Add the products and financing details",
        "Click 'Initiate TPV Call' to start the automated verification",
        "The AI will call the customer and verify the deal details",
        "Check the call status and recording once complete",
      ],
    },
    {
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      title: "Customers",
      description: "View and manage all your customer records and deal history.",
      steps: [
        "Click 'Customers' in the top navigation bar",
        "Search or scroll through your customer list",
        "Tap on a customer to view their full profile",
        "See all associated documents, TPV calls, and deal history",
      ],
    },
    {
      icon: ScanLine,
      color: "text-purple-600",
      bg: "bg-purple-50",
      title: "ID Scanner",
      description: "Scan customer IDs to auto-fill their information and verify identity.",
      steps: [
        "Access the ID Scanner from the Documents section",
        "Take a clear photo of the customer's ID",
        "The AI will extract name, address, and ID details",
        "Confirm the extracted information is correct",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-slate-600 hover:text-slate-900 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
          <ProfileDropdown />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-4">
            <HelpCircle className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">How to Use the CRM</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            A quick guide to help you navigate and use all the tools available to you.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Quick Start</h2>
          <ol className="space-y-2.5 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              <span>Log in with your Agent ID on the login screen.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              <span>You'll land on the <strong>Dashboard</strong> — your central hub with all available tools.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <span>Tap on any tool card to get started. Use <strong>Customers</strong> in the top nav to view your deal history.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">4</span>
              <span>Use the profile icon (top right) to view your stats, switch companies, or log out.</span>
            </li>
          </ol>
        </div>

        {/* Tool Sections */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Tools Guide</h2>
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${section.bg} flex items-center justify-center`}>
                  <section.icon className={`w-4.5 h-4.5 ${section.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                </div>
              </div>
              <div className="space-y-1.5 pl-12">
                {section.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-10 mb-6">
          <p className="text-xs text-slate-400">Need more help? Contact your team lead or admin.</p>
        </div>
      </main>
    </div>
  );
};

export default HelpPage;
