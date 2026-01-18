import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import Index from "./Index";
import LoanApplicationPage from "./LoanApplicationPage";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenant();
  const customer = location.state?.customer;
  const invoiceProfile = location.state?.invoiceProfile;
  const calculatorData = location.state?.calculatorData;
  const initialTab = location.state?.tab || 'invoice';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loadedItems, setLoadedItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  // Fetch full product configuration from database when customer is provided
  useEffect(() => {
    const fetchItemsFromDatabase = async () => {
      if (!customer?.id) return;
      
      setLoadingItems(true);
      try {
        const { data: tpvData, error } = await supabase
          .from("tpv_requests")
          .select("items_json, sales_price, interest_rate, promotional_term, amortization")
          .eq("customer_id", customer.id)
          .not("items_json", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching items:", error);
          return;
        }

        if (tpvData?.items_json) {
          const savedConfig = tpvData.items_json;
          
          if (Array.isArray(savedConfig)) {
            const itemsWithIds = savedConfig.map(item => ({
              ...item,
              id: item.id || crypto.randomUUID()
            }));
            setLoadedItems({
              items: itemsWithIds,
              financing: {
                financeCompany: 'Financeit Canada Inc.',
                loanAmount: 0,
                interestRate: parseFloat(tpvData.interest_rate) || 0,
                loanTerm: parseInt(tpvData.promotional_term) || 24,
                amortizationPeriod: parseInt(tpvData.amortization) || 180
              }
            });
          } else {
            const itemsWithIds = (savedConfig.items || []).map(item => ({
              ...item,
              id: item.id || crypto.randomUUID()
            }));
            setLoadedItems({
              items: itemsWithIds,
              financing: {
                financeCompany: savedConfig.financing?.financeCompany || 'Financeit Canada Inc.',
                loanAmount: savedConfig.financing?.loanAmount || 0,
                interestRate: savedConfig.financing?.interestRate || parseFloat(tpvData.interest_rate) || 0,
                loanTerm: savedConfig.financing?.loanTerm || parseInt(tpvData.promotional_term) || 24,
                amortizationPeriod: savedConfig.financing?.amortizationPeriod || parseInt(tpvData.amortization) || 180
              },
              rebatesIncentives: savedConfig.rebatesIncentives || null,
              subTotal: savedConfig.subTotal,
              taxAmount: savedConfig.taxAmount,
              taxPercentage: savedConfig.taxPercentage,
              grandTotal: savedConfig.grandTotal
            });
          }
        }
      } catch (err) {
        console.error("Error loading items from database:", err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItemsFromDatabase();
  }, [customer?.id]);

  const handleBack = () => {
    if (customer?.id) {
      navigate(`/customer/${customer.id}`);
    } else {
      navigate("/landing");
    }
  };

  const mergedInvoiceProfile = loadedItems ? {
    ...invoiceProfile,
    items: loadedItems.items,
    financing: {
      ...invoiceProfile?.financing,
      ...loadedItems.financing
    }
  } : invoiceProfile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[60]">
        <div className="max-w-5xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            Documents
          </h1>
          <div className="w-8 md:w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 md:px-4 py-4">
        {/* Toggle Switch */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 mb-4 flex">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'invoice'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            Invoice Generator
          </button>
          <button
            onClick={() => setActiveTab('loan')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'loan'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Loan Application
          </button>
        </div>

        {/* Invoice Generator Content */}
        {activeTab === 'invoice' && (
          loadingItems ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Index 
              preloadedCustomer={customer} 
              preloadedInvoiceProfile={mergedInvoiceProfile} 
              preloadedCalculatorData={calculatorData} 
            />
          )
        )}

        {/* Loan Application Content */}
        {activeTab === 'loan' && (
          <LoanApplicationPage 
            embedded={true}
            embeddedCustomer={customer}
            embeddedCalculatorData={calculatorData}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
