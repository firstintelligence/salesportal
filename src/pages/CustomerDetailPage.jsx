import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, FileText, CreditCard, Phone, ClipboardCheck, Calculator, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [tpvRequests, setTpvRequests] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    if (!authenticated) {
      navigate("/");
      return;
    }
    
    fetchCustomerData();
  }, [customerId, navigate]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch TPV requests
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
            
            <Separator className="my-6" />
            
            {/* Deal Action Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Deal Actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/invoice-generator', { state: { customer } })}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/loan-application', { state: { customer } })}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Loan Application
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/payment-calculator', { state: { customer } })}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Payment Calculator
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/tpv-ai', { state: { customer } })}
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
