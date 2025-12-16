import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Loader2, FileText, CreditCard, Phone, ClipboardCheck, 
  Calculator, Plus, DollarSign, Trash2, Mail, MapPin, Calendar,
  CheckCircle2, Clock, AlertCircle, ExternalLink, PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { tenant, loading: tenantLoading } = useTenant();
  const [customer, setCustomer] = useState(null);
  const [tpvRequests, setTpvRequests] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [invoiceProfile, setInvoiceProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const tenantSlug = tenant?.slug;

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    if (!authenticated) {
      navigate("/");
      return;
    }
    
    if (tenantLoading || !tenantSlug) return;
    
    fetchCustomerData();
    loadInvoiceProfile();
  }, [customerId, navigate, tenantLoading, tenantSlug]);

  const loadInvoiceProfile = () => {
    if (!tenantSlug) return;
    const savedProfile = localStorage.getItem(`invoice_profile_${tenantSlug}_${customerId}`);
    if (savedProfile) {
      setInvoiceProfile(JSON.parse(savedProfile));
    }
  };

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .eq("tenant_id", tenant.id)
        .single();

      if (customerError) {
        console.error("Error fetching customer:", customerError);
        setCustomer(null);
        return;
      }
      setCustomer(customerData);

      const { data: tpvData, error: tpvError } = await supabase
        .from("tpv_requests")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (tpvError) throw tpvError;
      setTpvRequests(tpvData || []);

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

  const handleDeleteCustomer = async () => {
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;

      // Clean up localStorage
      if (tenantSlug) {
        localStorage.removeItem(`invoice_profile_${tenantSlug}_${customerId}`);
      }

      toast.success("Customer deleted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

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

  const navigateToChecklist = () => {
    const latestTpv = tpvRequests[0];
    navigate('/installation-checklist', { state: { customer, tpvRequest: latestTpv || null } });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
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
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(numAmount);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800' };
      case 'pending':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800' };
      case 'initiated':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800' };
      default:
        return { icon: AlertCircle, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950', border: 'border-slate-200 dark:border-slate-800' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-4xl mx-auto">
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

  const latestTpv = tpvRequests[0];
  

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {customer.first_name} {customer.last_name}? This action cannot be undone and will remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteCustomer}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Customer Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {customer.first_name} {customer.last_name}
                </h1>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.province && `, ${customer.province}`}
                  {customer.postal_code && ` ${customer.postal_code}`}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Added {formatDate(customer.created_at)}
                </div>
                {invoiceProfile && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(invoiceProfile.grandTotal)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-col h-auto py-3 gap-1.5"
                onClick={() => navigate('/invoice-generator', { state: { customer, invoiceProfile } })}
              >
                <FileText className="w-4 h-4" />
                <span className="text-xs">{invoiceProfile ? 'Edit Invoice' : 'Invoice'}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-col h-auto py-3 gap-1.5"
                onClick={navigateToTpv}
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs">TPV</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-col h-auto py-3 gap-1.5"
                onClick={navigateToLoanApplication}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-xs">Loan</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-col h-auto py-3 gap-1.5"
                onClick={() => navigate('/payment-calculator', { state: { customer, invoiceProfile } })}
              >
                <Calculator className="w-4 h-4" />
                <span className="text-xs">Calculator</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-col h-auto py-3 gap-1.5"
                onClick={navigateToChecklist}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="text-xs">Checklist</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Activity Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Activity</h2>
            {tpvRequests.length === 0 && checklists.length === 0 && (
              <Button size="sm" onClick={navigateToTpv}>
                <Plus className="w-4 h-4 mr-1.5" />
                Start TPV
              </Button>
            )}
          </div>

          {tpvRequests.length === 0 && checklists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No activity yet. Start a TPV verification to begin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* TPV Requests */}
              {tpvRequests.map((tpv) => {
                const statusConfig = getStatusConfig(tpv.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <Card key={tpv.id} className={`${statusConfig.bg} ${statusConfig.border} border`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${statusConfig.bg}`}>
                            <Phone className={`w-4 h-4 ${statusConfig.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">TPV Verification</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(tpv.created_at)}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${statusConfig.color} ${statusConfig.border} capitalize`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {tpv.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Products</p>
                          <p className="font-medium truncate">{tpv.products || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Sale Price</p>
                          <p className="font-medium">{formatCurrency(tpv.sales_price)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Monthly</p>
                          <p className="font-medium">{formatCurrency(tpv.monthly_payment)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Rate</p>
                          <p className="font-medium">{tpv.interest_rate ? `${tpv.interest_rate}%` : "N/A"}</p>
                        </div>
                      </div>

                      {tpv.recording_url && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <a 
                            href={tpv.recording_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Listen to Recording
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Installation Checklists */}
              {checklists.map((checklist) => {
                const statusConfig = getStatusConfig(checklist.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <Card 
                    key={checklist.id} 
                    className={`${statusConfig.bg} ${statusConfig.border} border cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => navigate(`/installation-checklist/${checklist.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${statusConfig.bg}`}>
                            <ClipboardCheck className={`w-4 h-4 ${statusConfig.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Installation Checklist</p>
                            <p className="text-xs text-muted-foreground">
                              {checklist.submitted_at 
                                ? `Submitted ${formatDateTime(checklist.submitted_at)}`
                                : `Created ${formatDateTime(checklist.created_at)}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${statusConfig.color} ${statusConfig.border} capitalize`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {checklist.status}
                          </Badge>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
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
    </div>
  );
};

export default CustomerDetailPage;
