import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import Index from "./Index";

const InvoiceGeneratorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenant();
  const customer = location.state?.customer;
  const invoiceProfile = location.state?.invoiceProfile;
  const calculatorData = location.state?.calculatorData;
  
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
        // Get the latest TPV request for this customer that has items_json
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
          // Ensure each item has a unique ID for React reconciliation
          const itemsWithIds = tpvData.items_json.map(item => ({
            ...item,
            id: item.id || crypto.randomUUID()
          }));
          setLoadedItems({
            items: itemsWithIds,
            financing: {
              interestRate: parseFloat(tpvData.interest_rate) || 0,
              loanTerm: parseInt(tpvData.promotional_term) || 24,
              amortizationPeriod: parseInt(tpvData.amortization) || 180
            }
          });
        }
      } catch (err) {
        console.error("Error loading items from database:", err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItemsFromDatabase();
  }, [customer?.id]);

  // Determine back navigation based on where user came from
  const handleBack = () => {
    if (customer?.id) {
      navigate(`/customer/${customer.id}`);
    } else {
      navigate("/landing");
    }
  };

  // Merge loaded items with any existing invoice profile
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
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
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
            Invoice Generator
          </h1>
          <div className="w-8 md:w-16" /> {/* Spacer for centering */}
        </div>
      </div>
      {loadingItems ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Index 
          preloadedCustomer={customer} 
          preloadedInvoiceProfile={mergedInvoiceProfile} 
          preloadedCalculatorData={calculatorData} 
        />
      )}
    </div>
  );
};

export default InvoiceGeneratorPage;
