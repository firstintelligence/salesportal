import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, User, MapPin, Phone } from "lucide-react";
import InstallationChecklist from "@/components/checklist/InstallationChecklist";
import { useTenant } from "@/contexts/TenantContext";

const InstallationChecklistPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, isViewingAllTenants } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const agentId = localStorage.getItem("agentId");
  const isAdmin = agentId === "MM231611";

  // If navigated from customer profile with state, go directly to checklist
  const preloadedCustomer = location.state?.customer;
  const preloadedTpvRequest = location.state?.tpvRequest;

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
      return;
    }

    // If we have a preloaded customer, build the checklist customer object
    if (preloadedCustomer) {
      const latestTpv = preloadedTpvRequest;
      const checklistCustomer = {
        id: preloadedCustomer.id, // customer ID for new flow
        customer_id: preloadedCustomer.id,
        first_name: preloadedCustomer.first_name,
        last_name: preloadedCustomer.last_name,
        address: preloadedCustomer.address,
        customer_address: preloadedCustomer.address,
        city: preloadedCustomer.city,
        province: preloadedCustomer.province,
        postal_code: preloadedCustomer.postal_code,
        phone: preloadedCustomer.phone,
        products: latestTpv?.products || '',
        tpv_request_id: latestTpv?.id || null,
      };
      setSelectedCustomer(checklistCustomer);
      setLoading(false);
      return;
    }

    fetchCustomers();
  }, [navigate, preloadedCustomer]);

  const fetchCustomers = async () => {
    try {
      // Fetch customers directly (not TPV requests)
      let query = supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by tenant
      if (!isViewingAllTenants && tenant?.id) {
        query = query.eq("tenant_id", tenant.id);
      }

      // Filter by agent if not admin
      if (!isAdmin) {
        query = query.eq("agent_id", agentId);
      }

      const { data: customerData, error } = await query;
      if (error) throw error;

      // For each customer, get their latest TPV (for products) and checklist status
      const enrichedCustomers = await Promise.all(
        (customerData || []).map(async (cust) => {
          // Get latest TPV for products
          const { data: tpvData } = await supabase
            .from("tpv_requests")
            .select("id, products, sales_price")
            .eq("customer_id", cust.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get checklist status
          const { data: checklistData } = await supabase
            .from("installation_checklists")
            .select("id, status, submitted_at")
            .eq("customer_id", cust.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...cust,
            customer_id: cust.id,
            customer_address: cust.address,
            products: tpvData?.products || '',
            sales_price: tpvData?.sales_price,
            tpv_request_id: tpvData?.id || null,
            checklist_status: checklistData?.status || 'not_started',
          };
        })
      );

      setCustomers(enrichedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" /> Submitted
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
            <Clock className="w-3 h-3 mr-1" /> Started
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" /> Not Started
          </Badge>
        );
    }
  };

  if (selectedCustomer) {
    return (
      <InstallationChecklist
        customer={selectedCustomer}
        onBack={() => {
          if (preloadedCustomer) {
            navigate(-1);
          } else {
            setSelectedCustomer(null);
            fetchCustomers();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            Installation Checklist
          </h1>
          <div className="w-8 md:w-16" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No customers found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {customers.map((customer) => {
              const isSubmitted = customer.checklist_status === "completed";

              return (
                <Card
                  key={customer.id}
                  className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.01] ${
                    isSubmitted ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {customer.first_name} {customer.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{customer.address}, {customer.city}</span>
                        </div>
                        {customer.products && (
                          <p className="text-xs text-muted-foreground truncate pl-6">
                            {customer.products}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(customer.checklist_status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallationChecklistPage;
