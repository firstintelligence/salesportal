import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import InvoiceGeneratorPage from "./pages/InvoiceGeneratorPage";
import SavingsCalculatorPage from "./pages/SavingsCalculatorPage";
import TPVAiPage from "./pages/TPVAiPage";
import TpvRequestPage from "./pages/TpvRequestPage";
import TemplatePage from "./pages/TemplatePage";
import ReceiptPage from "./pages/ReceiptPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/invoice-generator" element={<InvoiceGeneratorPage />} />
          <Route path="/savings-calculator" element={<SavingsCalculatorPage />} />
          <Route path="/tpv-ai" element={<TPVAiPage />} />
          <Route path="/tpv-request" element={<TpvRequestPage />} />
          <Route path="/template" element={<TemplatePage />} />
          <Route path="/receipt" element={<ReceiptPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
