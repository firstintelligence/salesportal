import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, FileText, CreditCard, Phone, ClipboardCheck, Calculator, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { tenant, loading: tenantLoading } = useTenant();
  const [customer, setCustomer] = useState(null);
  const [tpvRequests, setTpvRequests] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [invoiceProfile, setInvoiceProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tenant-specific localStorage key for invoice profiles
  const tenantSlug = tenant?.slug;

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    if (!authenticated) {
      navigate("/");
      return;
    }
    
    // Wait for tenant to load before fetching data
    if (tenantLoading || !tenantSlug) return;
    
    fetchCustomerData();
    loadInvoiceProfile();
  }, [customerId, navigate, tenantLoading, tenantSlug]);

  const loadInvoiceProfile = () => {
    if (!tenantSlug) return;
    // Use tenant-scoped key for complete isolation
    const savedProfile = localStorage.getItem(`invoice_profile_${tenantSlug}_${customerId}`);
    if (savedProfile) {
      setInvoiceProfile(JSON.parse(savedProfile));
    }
  };

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // CRITICAL: Verify customer belongs to current tenant for data isolation
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .eq("tenant_id", tenant.id) // CRITICAL: Filter by tenant for security
        .single();

      if (customerError) {
        console.error("Error fetching customer:", customerError);
        setCustomer(null);
        return;
      }
      setCustomer(customerData);

      // Fetch TPV requests (filtered by customer which is already tenant-filtered)
      const { data: tpvData, error: tpvError } = await supabase
        .from("tpv_requests")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (tpvError) throw tpvError;
      setTpvRequests(tpvData || []);

      // Fetch installation checklists
      const { data: checklistData, error: checklistError } = await supabase
        .from("installation_checklists")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (checklistError) throw checklistError;
      setChecklists(checklistData || []);

    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get TPV data for prefilling tools
  const getLatestTpvData = () => {
    const latestTpv = tpvRequests[0];
    return latestTpv ? {
      products: latestTpv.products,
      salesPrice: latestTpv.sales_price,
      interestRate: latestTpv.interest_rate,
      monthlyPayment: latestTpv.monthly_payment,
      amortization: latestTpv.amortization,
      promotionalTerm: latestTpv.promotional_term
    } : null;
  };

  const navigateToTpv = () => {
    const tpvData = getLatestTpvData();
    navigate('/tpv-ai', { 
      state: { 
        customer,
        prefillData: tpvData || (invoiceProfile ? {
          products: invoiceProfile.items?.map(i => i.name).join(', '),
          salesPrice: invoiceProfile.grandTotal,
          interestRate: invoiceProfile.financing?.interestRate
        } : null)
      } 
    });
  };

  const navigateToLoanApplication = () => {
    const tpvData = getLatestTpvData();
    navigate('/loan-application', { 
      state: { 
        customer,
        invoiceProfile,
        prefillData: {
          salesPrice: tpvData?.salesPrice || invoiceProfile?.grandTotal,
          monthlyPayment: tpvData?.monthlyPayment
        }
      } 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Customer not found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              {customer.first_name && customer.last_name 
                ? `${customer.first_name} ${customer.last_name}`
                : "Customer Profile"}
            </CardTitle>
            <CardDescription>Customer details and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-base">{customer.phone}</p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{customer.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-base">
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.province && `, ${customer.province}`}
                  {customer.postal_code && ` ${customer.postal_code}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Since</p>
                <p className="text-base">{formatDate(customer.created_at)}</p>
              </div>
            </div>
            
            {/* Invoice Profile Summary (if saved) */}
            {invoiceProfile && (
              <>
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Invoice Profile</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Saved {new Date(invoiceProfile.savedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Products</p>
                      <p className="font-medium">{invoiceProfile.items?.length || 0} items</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-medium">{formatCurrency(invoiceProfile.subTotal)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tax</p>
                      <p className="font-medium">{formatCurrency(invoiceProfile.taxAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-primary">{formatCurrency(invoiceProfile.grandTotal)}</p>
                    </div>
                  </div>
                </div>
                <Separator className="my-6" />
              </>
            )}
            
            <Separator className="my-6" />
            
            {/* Deal Action Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Deal Actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/invoice-generator', { state: { customer, invoiceProfile } })}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {invoiceProfile ? 'Edit Invoice' : 'Create Invoice'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={navigateToLoanApplication}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Loan Application
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/payment-calculator', { state: { customer, invoiceProfile } })}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Payment Calculator
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={navigateToTpv}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Request TPV
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    const latestTpv = tpvRequests[0];
                    if (latestTpv) {
                      navigate('/installation-checklist', { state: { customer, tpvRequest: latestTpv } });
                    } else {
                      toast.error("No TPV request found. Please create a TPV request first.");
                    }
                  }}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Installation Checklist
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TPV Requests */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <CardTitle>TPV Verification</CardTitle>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/tpv-request', { state: { customer } })}
              >
                <Plus className="w-4 h-4 mr-2" />
                New TPV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tpvRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No TPV requests found. Create one to get started.</p>
            ) : (
              <div className="space-y-4">
                {tpvRequests.map((tpv) => (
                  <div key={tpv.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">TPV Request</p>
                        <p className="text-sm text-muted-foreground">{formatDate(tpv.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tpv.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {tpv.status}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Products</p>
                        <p>{tpv.products || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sales Price</p>
                        <p>{formatCurrency(tpv.sales_price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest Rate</p>
                        <p>{tpv.interest_rate ? `${tpv.interest_rate}%` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Payment</p>
                        <p>{formatCurrency(tpv.monthly_payment)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installation Checklists */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                <CardTitle>Installation Checklists</CardTitle>
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  const latestTpv = tpvRequests[0];
                  if (latestTpv) {
                    navigate('/installation-checklist', { state: { customer, tpvRequest: latestTpv } });
                  } else {
                    toast.error("No TPV request found. Please create a TPV request first.");
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Checklist
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {checklists.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No installation checklists found. Create one after completing TPV.</p>
            ) : (
              <div className="space-y-4">
                {checklists.map((checklist) => (
                  <div 
                    key={checklist.id} 
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/installation-checklist/${checklist.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Installation Checklist</p>
                        <p className="text-sm text-muted-foreground">{formatDate(checklist.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        checklist.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {checklist.status}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Agent: {checklist.agent_id}</p>
                      {checklist.submitted_at && (
                        <p className="text-muted-foreground">Submitted: {formatDate(checklist.submitted_at)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
