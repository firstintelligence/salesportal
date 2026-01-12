import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { TenantProvider } from "./contexts/TenantContext";
import TenantSwitcher from "./components/TenantSwitcher";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import InvoiceGeneratorPage from "./pages/InvoiceGeneratorPage";
import SavingsCalculatorPage from "./pages/SavingsCalculatorPage";
import TPVAiPage from "./pages/TPVAiPage";
import TemplatePage from "./pages/TemplatePage";
import ReceiptPage from "./pages/ReceiptPage";
import LoanApplicationPage from "./pages/LoanApplicationPage";
import PaymentCalculatorPage from "./pages/PaymentCalculatorPage";
import InstallationChecklistPage from "./pages/InstallationChecklistPage";
import InvoiceRenderPage from "./pages/InvoiceRenderPage";
import StatsPage from "./pages/StatsPage";
import SigningCertificatesPage from "./pages/SigningCertificatesPage";
import ProfitCalculatorPage from "./pages/ProfitCalculatorPage";
import QualifyPage from "./pages/QualifyPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showTenantSwitcher = location.pathname !== '/' && location.pathname !== '/invoice-render';

  return (
    <>
      {showTenantSwitcher && <TenantSwitcher />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/invoice-render" element={<InvoiceRenderPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customer/:customerId" element={<CustomerDetailPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/invoice-generator" element={<InvoiceGeneratorPage />} />
        <Route path="/savings-calculator" element={<SavingsCalculatorPage />} />
        <Route path="/loan-application" element={<LoanApplicationPage />} />
        <Route path="/payment-calculator" element={<PaymentCalculatorPage />} />
        <Route path="/tpv-ai" element={<TPVAiPage />} />
        <Route path="/template" element={<TemplatePage />} />
        <Route path="/receipt" element={<ReceiptPage />} />
        <Route path="/installation-checklist" element={<InstallationChecklistPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/signing-certificates" element={<SigningCertificatesPage />} />
        <Route path="/profit-calculator" element={<ProfitCalculatorPage />} />
        <Route path="/qualify" element={<QualifyPage />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </TenantProvider>
  </QueryClientProvider>
);

export default App;
