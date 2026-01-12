import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Loader2, FileText, CreditCard, Phone, ClipboardCheck, 
  Calculator, Plus, DollarSign, Trash2, Mail, MapPin, Calendar,
  CheckCircle2, Clock, AlertCircle, ExternalLink, PlayCircle, Download,
  Globe, Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTenant, SUPER_ADMIN_TENANT } from "@/contexts/TenantContext";
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
  const { tenant, loading: tenantLoading, isViewingAllTenants, isSuperAdmin } = useTenant();
  const [customer, setCustomer] = useState(null);
  const [tpvRequests, setTpvRequests] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [documentSignatures, setDocumentSignatures] = useState([]);
  const [invoiceProfile, setInvoiceProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const tenantSlug = tenant?.slug;

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    if (!authenticated) {
      navigate("/");
      return;
    }
    
    // Check if current user is admin
    const agentId = localStorage.getItem("agentId");
    setIsAdmin(agentId === 'MM23');
    
    // For super admin viewing all tenants, we don't need tenantSlug
    if (tenantLoading) return;
    if (!isViewingAllTenants && !tenantSlug) return;
    
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
      const agentId = localStorage.getItem("agentId");

      // Build query - super admin viewing all tenants can see any customer
      let customerQuery = supabase
        .from("customers")
        .select("*")
        .eq("id", customerId);
      
      // Only filter by tenant if not super admin viewing all tenants
      if (!isViewingAllTenants && tenant?.id) {
        customerQuery = customerQuery.eq("tenant_id", tenant.id);
      }

      const { data: customerData, error: customerError } = await customerQuery.maybeSingle();

      if (customerError) {
        console.error("Error fetching customer:", customerError);
        setCustomer(null);
        return;
      }
      
      if (!customerData) {
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

      // Fetch document signatures for this customer (admin can see all signatures)
      if (agentId === 'MM23') {
        // First try by customer_id
        const { data: sigData, error: sigError } = await supabase
          .from("document_signatures")
          .select("*")
          .eq("customer_id", customerId)
          .order("signed_at", { ascending: false });
        
        if (!sigError && sigData && sigData.length > 0) {
          setDocumentSignatures(sigData);
        } else {
          // Fallback: try matching by customer name if no customer_id match
          if (customerData) {
            const customerFullName = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim();
            if (customerFullName) {
              const { data: sigByName, error: sigByNameError } = await supabase
                .from("document_signatures")
                .select("*")
                .ilike("customer_name", `%${customerFullName}%`)
                .order("signed_at", { ascending: false });
              
              if (!sigByNameError && sigByName) {
                setDocumentSignatures(sigByName);
              }
            }
          }
        }
      }

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

                      {/* Actions: Recording and Generate Invoice */}
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-wrap">
                        {tpv.recording_url && (
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
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to invoice generator with this TPV's data prefilled
                            navigate('/invoice-generator', { 
                              state: { 
                                customer,
                                invoiceProfile,
                                calculatorData: {
                                  products: tpv.products,
                                  salesPrice: tpv.sales_price,
                                  interestRate: tpv.interest_rate,
                                  monthlyPayment: tpv.monthly_payment,
                                  amortization: tpv.amortization,
                                  promotionalTerm: tpv.promotional_term
                                }
                              } 
                            });
                          }}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Generate Invoice
                        </Button>
                      </div>
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

        {/* Document Signatures Section (Admin Only) */}
        {isAdmin && documentSignatures.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Document Signatures</h2>
              <Badge variant="secondary" className="text-xs">Admin Only</Badge>
            </div>

            <div className="space-y-3">
              {documentSignatures.map((sig) => (
                <Card key={sig.id} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {sig.document_type?.replace(/_/g, ' ') || 'Document'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Signed {formatDateTime(sig.signed_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {sig.signature_type?.replace(/_/g, ' ') || 'Customer'}
                      </Badge>
                    </div>
                    
                    {/* Signing Location Details */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Signing Location</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Location</p>
                          <p className="font-medium">{sig.location_string || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">IP Address</p>
                          <p className="font-medium font-mono text-xs">{sig.ip_address || 'N/A'}</p>
                        </div>
                        {sig.city && (
                          <div>
                            <p className="text-muted-foreground text-xs">City</p>
                            <p className="font-medium">{sig.city}, {sig.region}</p>
                          </div>
                        )}
                        {sig.country && (
                          <div>
                            <p className="text-muted-foreground text-xs">Country</p>
                            <p className="font-medium">{sig.country}</p>
                          </div>
                        )}
                        {sig.latitude && sig.longitude && (
                          <div>
                            <p className="text-muted-foreground text-xs">Coordinates</p>
                            <p className="font-medium font-mono text-xs">
                              {parseFloat(sig.latitude).toFixed(4)}, {parseFloat(sig.longitude).toFixed(4)}
                            </p>
                          </div>
                        )}
                        {sig.timezone && (
                          <div>
                            <p className="text-muted-foreground text-xs">Timezone</p>
                            <p className="font-medium">{sig.timezone}</p>
                          </div>
                        )}
                        {sig.isp && (
                          <div className="sm:col-span-2">
                            <p className="text-muted-foreground text-xs">ISP</p>
                            <p className="font-medium truncate">{sig.isp}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Download Button and Agent Info */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        <span>Signed by: {sig.customer_name || 'Unknown'}</span>
                        <span className="mx-2">•</span>
                        <span>Agent: {sig.agent_id}</span>
                      </div>
                      {sig.document_url && (
                        <a
                          href={sig.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailPage;
