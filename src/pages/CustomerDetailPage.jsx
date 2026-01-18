import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, FileText, CreditCard, Phone, ClipboardCheck, 
  Calculator, Plus, DollarSign, Trash2, Mail, MapPin, Calendar,
  CheckCircle2, Clock, AlertCircle, ExternalLink, PlayCircle, Download,
  Globe, Fingerprint, ScanLine, Grid2X2, Users, Copy, Navigation
} from "lucide-react";
import { formatPhoneNumber } from "@/utils/phoneFormat";
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
  const [idScans, setIdScans] = useState([]);
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
    setIsAdmin(agentId === 'MM231611');
    
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

      // Fetch document signatures and ID scans for this customer (admin can see all)
      if (agentId === 'MM231611') {
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

        // Fetch ID scans for this customer
        const { data: idScanData, error: idScanError } = await supabase
          .from("id_scans")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });
        
        if (!idScanError && idScanData) {
          setIdScans(idScanData);
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
    
    // Build calculator data from invoice profile or TPV data
    const calculatorData = invoiceProfile ? {
      purchaseAmount: invoiceProfile.grandTotal,
      interestRate: invoiceProfile.financing?.interestRate,
      promoTerm: invoiceProfile.financing?.loanTerm,
      amortizationPeriod: invoiceProfile.financing?.amortizationPeriod,
      items: invoiceProfile.items // Pass full items array
    } : (tpvData ? {
      purchaseAmount: parseFloat(tpvData.salesPrice) || 0,
      interestRate: parseFloat(tpvData.interestRate) || 0,
      promoTerm: parseInt(tpvData.promotionalTerm) || 24,
      amortizationPeriod: parseInt(tpvData.amortization) || 180,
      products: tpvData.products?.split(', ') || []
    } : null);
    
    navigate('/tpv-ai', { 
      state: { 
        customer,
        calculatorData
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
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate("/customers")}>
            <Grid2X2 className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
          <Card className="mt-6 bg-white">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Customer not found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const latestTpv = tpvRequests[0];
  

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const fullAddress = [
    customer.address,
    customer.city,
    customer.province,
    customer.postal_code
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header - matching dashboard/customers style */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left - Tenant indicator */}
          <div className="flex items-center">
            {tenant && (
              <span className="text-xs text-slate-500 font-medium truncate max-w-[120px] sm:max-w-none">
                {tenant.name}
              </span>
            )}
          </div>
          
          {/* Right - Navigation */}
          <div className="flex items-center gap-2 sm:gap-1.5">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            >
              <Grid2X2 className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
            </Button>
            
            <Button
              onClick={() => navigate("/customers")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Customers</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Customer Profile Card - Clean Design */}
        <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Colored top bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
          
          <CardContent className="p-4 sm:p-6">
            {/* Top row: Name and Date */}
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                {customer.first_name} {customer.last_name}
              </h1>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(customer.created_at)}</span>
              </div>
            </div>
            
            {/* Simple Contact Info - Click to copy */}
            <div className="space-y-1.5 mb-4">
              <button 
                onClick={() => copyToClipboard(formatPhoneNumber(customer.phone), 'Phone')}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors group w-full text-left"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatPhoneNumber(customer.phone)}</span>
                <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              {customer.email && (
                <button 
                  onClick={() => copyToClipboard(customer.email, 'Email')}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors group w-full text-left"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                  <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              
              <button 
                onClick={() => copyToClipboard(fullAddress, 'Address')}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors group w-full text-left"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{fullAddress}</span>
                <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            </div>
            
            {/* Invoice Total Badge */}
            {invoiceProfile && (
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-sm px-3 py-1">
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  {formatCurrency(invoiceProfile.grandTotal)}
                </Badge>
              </div>
            )}
            
            {/* Quick Actions - Inline on mobile */}
            <div className="flex flex-wrap gap-1.5 sm:grid sm:grid-cols-5 sm:gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-3 gap-1.5 bg-white hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors sm:flex-col sm:h-auto sm:py-3"
                onClick={() => navigate('/invoice-generator', { state: { customer, invoiceProfile } })}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">{invoiceProfile ? 'Invoice' : 'Invoice'}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-3 gap-1.5 bg-white hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-600 transition-colors sm:flex-col sm:h-auto sm:py-3"
                onClick={navigateToTpv}
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">TPV</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-3 gap-1.5 bg-white hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 transition-colors sm:flex-col sm:h-auto sm:py-3"
                onClick={navigateToLoanApplication}
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">Loan</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-3 gap-1.5 bg-white hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-colors sm:flex-col sm:h-auto sm:py-3"
                onClick={() => navigate('/payment-calculator', { state: { customer, invoiceProfile } })}
              >
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">Calc</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-3 gap-1.5 bg-white hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-colors sm:flex-col sm:h-auto sm:py-3"
                onClick={navigateToChecklist}
              >
                <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">Check</span>
              </Button>
            </div>
          </CardContent>
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

        {/* ID Scans Section (Admin Only) */}
        {isAdmin && idScans.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-foreground">ID Scans</h2>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Admin Only</Badge>
            </div>

            <div className="space-y-3">
              {idScans.map((scan) => (
                <Card key={scan.id} className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                          <User className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {scan.first_name} {scan.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scan.id_type} • Scanned {new Date(scan.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">{scan.status}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">ID Number</p>
                        <p className="font-mono font-medium">{scan.id_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">DOB</p>
                        <p className="font-medium">{scan.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ID Expiry</p>
                        <p className="font-medium">{scan.id_expiry || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium truncate">{scan.address}</p>
                      </div>
                    </div>

                    {scan.id_image_path && (
                      <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                        <a
                          href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${scan.id_image_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800"
                        >
                          <Download className="w-4 h-4" />
                          View ID Photo
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Document Signatures Section (Admin Only) */}
        {isAdmin && documentSignatures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Signatures</h2>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>
            </div>

            <div className="space-y-2">
              {documentSignatures.map((sig) => (
                <Card key={sig.id} className="bg-slate-50 border-slate-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Doc info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground capitalize truncate">
                            {sig.document_type?.replace(/_/g, ' ') || 'Document'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateTime(sig.signed_at)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Right: Location + Map link */}
                      <div className="flex items-center gap-2 shrink-0">
                        {sig.latitude && sig.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${sig.latitude},${sig.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-medium hover:bg-blue-100 transition-colors"
                          >
                            <Navigation className="w-3 h-3" />
                            Map
                          </a>
                        )}
                        {sig.document_url && (
                          <a
                            href={sig.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-medium hover:bg-primary/20 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Compact location info */}
                    {sig.location_string && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
                        📍 {sig.location_string}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Delete Customer Button - at the very bottom */}
        <div className="pt-4 pb-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-red-500 border-red-200 hover:text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Customer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {customer.first_name} {customer.last_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteCustomer}
                  className="bg-red-500 text-white hover:bg-red-600"
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
  );
};

export default CustomerDetailPage;
