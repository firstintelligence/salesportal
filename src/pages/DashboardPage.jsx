import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Phone, PhoneCall, MapPin, Search, FileText, ClipboardCheck, Check, Download, PlayCircle, CreditCard, Shield, Grid2X2, Users, User, Send, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatPhoneNumber, formatPostalCode, capitalizeWords } from "@/utils/inputFormatting";
import { useTenant } from "@/contexts/TenantContext";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading, isViewingAllTenants, isSuperAdmin } = useTenant();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tenantNames, setTenantNames] = useState({}); // Map of tenant_id to name
  const [newDeal, setNewDeal] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
    postal_code: ""
  });

  const agentNames = {
    "MM231611": "MoMo",
    "TB0195": "Tadeo",
    "AA9097": "Donny",
    "HB6400": "Harry",
    "TP5142": "Tony",
    "CI11": "Chris",
    "LA11": "Levi",
    "AW11": "Ann",
    "MA11": "Mohamed",
    "MW11": "Mohan",
    "BB2704": "Bonnie",
    "AB5394": "Abe",
    "CH5149": "Chady"
  };

  const getAgentName = (id) => agentNames[id] || id;

  // Fetch tenant names for super admin view
  useEffect(() => {
    const fetchTenantNames = async () => {
      if (isViewingAllTenants) {
        const { data } = await supabase.from('tenants').select('id, name');
        if (data) {
          const nameMap = {};
          data.forEach(t => { nameMap[t.id] = t.name; });
          setTenantNames(nameMap);
        }
      }
    };
    fetchTenantNames();
  }, [isViewingAllTenants]);

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    const storedAgentId = localStorage.getItem("agentId");
    
    if (!authenticated) {
      navigate("/");
      return;
    }
    
    setAgentId(storedAgentId);
    
    // Wait for tenant to load before fetching deals
    if (!tenantLoading && tenant?.id) {
      fetchDeals(storedAgentId, tenant.id, isViewingAllTenants);
    }
  }, [navigate, tenant?.id, tenantLoading, isViewingAllTenants]);

  const fetchDeals = async (currentAgentId, tenantId, viewingAllTenants = false) => {
    try {
      setLoading(true);
      
      // Check if current agent is a super admin
      const { data: adminCheck } = await supabase
        .rpc('is_admin_agent', { agent_id: currentAgentId });
      
      const isAdmin = adminCheck === true;
      
      // Build query
      let query = supabase
        .from("customers")
        .select(`
          *,
          tpv_requests!customer_id(
            id,
            agent_id,
            products,
            sales_price,
            status,
            recording_url,
            created_at,
            updated_at
          ),
          document_signatures!customer_id(
            id,
            document_type,
            document_url,
            signature_type,
            signed_at,
            invoice_amount
          ),
          document_deliveries!customer_id(
            id,
            sent_at,
            status
          ),
          id_scans!customer_id(
            id,
            id_image_path,
            created_at
          )
        `)
        .order("updated_at", { ascending: false });

      // If viewing all tenants (Super Admin mode), don't filter by tenant
      // Otherwise, filter by the selected tenant
      if (!viewingAllTenants) {
        query = query.eq("tenant_id", tenantId);
      }

      // Only filter by agent_id if NOT a super admin
      if (!isAdmin) {
        query = query.eq("agent_id", currentAgentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setDeals(data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return null;
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getStatusConfig = (tpvStatus) => {
    const status = tpvStatus?.toLowerCase();
    if (status === 'completed') return {
      border: 'border-l-emerald-500',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      label: 'Verified'
    };
    if (status === 'pending' || status === 'initiated') return {
      border: 'border-l-amber-500',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      label: 'Pending'
    };
    if (status === 'failed') return {
      border: 'border-l-red-500',
      bg: 'bg-gradient-to-br from-red-50 to-rose-50/50 dark:from-red-950/30 dark:to-rose-950/20',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      label: 'Failed'
    };
    return {
      border: 'border-l-slate-300 dark:border-l-slate-600',
      bg: 'bg-card',
      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      label: 'New'
    };
  };

  const handleCreateDeal = async () => {
    try {
      if (!newDeal.first_name || !newDeal.last_name || !newDeal.phone || !newDeal.address) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Prevent creating deals when viewing all tenants (no valid tenant_id)
      if (isViewingAllTenants) {
        toast.error("Please select a specific tenant to create a new deal.");
        return;
      }
      
      if (!tenant?.id) {
        toast.error("Tenant not loaded. Please try again.");
        return;
      }

      const currentAgentId = localStorage.getItem("agentId");
      const customerId = crypto.randomUUID();
      
      const { error } = await supabase
        .from("customers")
        .insert([{
          id: customerId,
          first_name: newDeal.first_name.trim(),
          last_name: newDeal.last_name.trim(),
          phone: newDeal.phone.trim(),
          email: newDeal.email.trim() || null,
          address: newDeal.address.trim(),
          city: newDeal.city.trim() || null,
          province: newDeal.province.trim() || null,
          postal_code: newDeal.postal_code.trim() || null,
          tenant_id: tenant.id, // CRITICAL: Associate customer with current tenant
          agent_id: currentAgentId // Track which agent created this customer
        }]);

      if (error) throw error;

      toast.success("New deal created!");
      setIsCreateDialogOpen(false);
      setNewDeal({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        province: "",
        postal_code: ""
      });

      navigate(`/customer/${customerId}`);
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create new deal");
    }
  };

  const handleActionClick = (e, action, customer) => {
    e.stopPropagation();
    switch (action) {
      case 'tpv':
        navigate(`/customer/${customer.id}?action=tpv`);
        break;
      case 'loan':
        navigate(`/customer/${customer.id}?action=loan`);
        break;
      case 'invoice':
        navigate(`/customer/${customer.id}?action=invoice`);
        break;
      case 'checklist':
        navigate(`/customer/${customer.id}?action=checklist`);
        break;
      default:
        navigate(`/customer/${customer.id}`);
    }
  };

  const filteredDeals = deals.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
    const phone = (customer.phone || '').toLowerCase();
    const address = (customer.address || '').toLowerCase();
    return fullName.includes(query) || phone.includes(query) || address.includes(query);
  });

  const ActionButton = ({ completed, inProgress, icon: Icon, label, onClick }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
            completed 
              ? 'bg-emerald-500 text-white' 
              : inProgress
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {completed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );

  // CRITICAL: Block rendering until tenant is fully loaded to prevent cross-tenant data exposure
  if (tenantLoading || !tenant?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header - matching dashboard style */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left - Navigation */}
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
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium transition-all duration-200"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Customers</span>
            </Button>
          </div>
          
          {/* Center - Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-800">
              Customers
            </h1>
            {isViewingAllTenants && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <Shield className="w-2.5 h-2.5" />
                All Tenants
              </span>
            )}
          </div>
          
          {/* Right - Spacer */}
          <div className="w-20 sm:w-32" />
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="text-sm text-slate-500">
            {filteredDeals.length} customer{filteredDeals.length !== 1 ? 's' : ''} total
            {isViewingAllTenants && ` across all tenants`}
          </p>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="default" className="gap-2 rounded-xl h-10 px-5 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">New Deal</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create New Deal</DialogTitle>
                  <DialogDescription>
                    Enter customer information to get started
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-xs font-medium">First Name *</Label>
                      <Input
                        id="first_name"
                        value={newDeal.first_name}
                        onChange={(e) => setNewDeal({ ...newDeal, first_name: capitalizeWords(e.target.value) })}
                        placeholder="John"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-xs font-medium">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={newDeal.last_name}
                        onChange={(e) => setNewDeal({ ...newDeal, last_name: capitalizeWords(e.target.value) })}
                        placeholder="Smith"
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-medium">Phone *</Label>
                      <Input
                        id="phone"
                        value={newDeal.phone}
                        onChange={(e) => {
                          const input = e.target.value;
                          const digits = input.replace(/\D/g, '').slice(0, 10);
                          let formatted = '';
                          if (digits.length > 0) {
                            formatted = '(' + digits.slice(0, 3);
                            if (digits.length > 3) {
                              formatted += ') ' + digits.slice(3, 6);
                              if (digits.length > 6) {
                                formatted += '-' + digits.slice(6);
                              }
                            }
                          }
                          setNewDeal({ ...newDeal, phone: formatted });
                        }}
                        placeholder="(416) 555-1234"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newDeal.email}
                        onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                        placeholder="john@example.com"
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-medium">Address *</Label>
                    <Input
                      id="address"
                      value={newDeal.address}
                      onChange={(e) => setNewDeal({ ...newDeal, address: capitalizeWords(e.target.value) })}
                      placeholder="123 Main Street"
                      className="h-10 rounded-xl"
                    />
                  </div>
                    
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs font-medium">City</Label>
                      <Input
                        id="city"
                        value={newDeal.city}
                        onChange={(e) => setNewDeal({ ...newDeal, city: capitalizeWords(e.target.value) })}
                        placeholder="Toronto"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-xs font-medium">Province</Label>
                      <Select
                        value={newDeal.province}
                        onValueChange={(value) => setNewDeal({ ...newDeal, province: value })}
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AB">AB</SelectItem>
                          <SelectItem value="BC">BC</SelectItem>
                          <SelectItem value="MB">MB</SelectItem>
                          <SelectItem value="NB">NB</SelectItem>
                          <SelectItem value="NL">NL</SelectItem>
                          <SelectItem value="NS">NS</SelectItem>
                          <SelectItem value="NT">NT</SelectItem>
                          <SelectItem value="NU">NU</SelectItem>
                          <SelectItem value="ON">ON</SelectItem>
                          <SelectItem value="PE">PE</SelectItem>
                          <SelectItem value="QC">QC</SelectItem>
                          <SelectItem value="SK">SK</SelectItem>
                          <SelectItem value="YT">YT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code" className="text-xs font-medium">Postal</Label>
                      <Input
                        id="postal_code"
                        value={newDeal.postal_code}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\s/g, '').toUpperCase().slice(0, 6);
                          const formatted = cleaned.length > 3 ? cleaned.slice(0, 3) + ' ' + cleaned.slice(3) : cleaned;
                          setNewDeal({ ...newDeal, postal_code: formatted });
                        }}
                        placeholder="M5V 1A1"
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDeal} className="rounded-xl bg-primary hover:bg-primary/90">
                    Create Deal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-muted/50 border-0 rounded-xl focus:bg-card focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Loading deals...</p>
            </div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <Card className="border-dashed border-2 bg-card/50 rounded-2xl">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No customers found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create a new deal to get started</p>
            </CardContent>
          </Card>
        ) : (
          <TooltipProvider delayDuration={300}>
            <div className="space-y-2">
              {filteredDeals.map((customer, index) => {
                // Get the most recently updated TPV request
                const sortedTpvRequests = [...(customer.tpv_requests || [])].sort((a, b) => 
                  new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
                );
                const latestTpv = sortedTpvRequests[0];
                const displayAgent = agentId === "MM231611" ? getAgentName(latestTpv?.agent_id || customer.agent_id) : null;
                const fullName = customer.first_name && customer.last_name 
                  ? `${customer.first_name} ${customer.last_name}`
                  : "Unnamed";
                // salesPrice will be determined after checking invoice documents
                const tpvCompleted = latestTpv?.status?.toLowerCase() === 'completed';
                const statusConfig = getStatusConfig(latestTpv?.status);
                
                // Get document signatures for this customer
                const documentSignatures = customer.document_signatures || [];
                const loanApplication = documentSignatures.find(d => d.document_type === 'loan_application');
                // Get the most recent invoice document (sorted by signed_at)
                const invoiceDocuments = documentSignatures
                  .filter(d => d.document_type === 'invoice')
                  .sort((a, b) => new Date(b.signed_at) - new Date(a.signed_at));
                const invoiceDocument = invoiceDocuments[0];
                const tpvRecording = latestTpv?.recording_url;
                
                // Use invoice_amount from signed document if available, otherwise fall back to TPV sales_price
                const displayAmount = invoiceDocument?.invoice_amount 
                  ? formatCurrency(invoiceDocument.invoice_amount)
                  : formatCurrency(latestTpv?.sales_price);
                
                // Determine completion states from actual data
                // Loan: has document = filled, has signature_type = signed
                const loanFilled = !!loanApplication?.document_url;
                const loanSigned = loanFilled && !!loanApplication?.signature_type;
                const loanCompleted = loanSigned; // For backward compatibility
                
                // Invoice: has document = filled, has signature_type = signed
                const invoiceFilled = !!invoiceDocument?.document_url;
                const invoiceSigned = invoiceFilled && !!invoiceDocument?.signature_type;
                
                const checklistCompleted = false; // TODO: check from installation_checklists table
                const docsSent = (customer.document_deliveries || []).some(d => d.status === 'sent');
                const hasIdScan = (customer.id_scans || []).length > 0;
                
                // Document badge click handler - download file instead of opening in blocked iframe
                const handleDocumentClick = (e, url, type) => {
                  e.stopPropagation();
                  if (url) {
                    // Create a temporary link to trigger download
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    // Extract filename from URL for download
                    const filename = url.split('/').pop() || `${type}.pdf`;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success(`Downloading ${type}...`);
                  } else {
                    toast.error(`No ${type} available`);
                  }
                };
                
                // Copy to clipboard handler for long-press functionality
                const handleCopyToClipboard = async (e, text, label) => {
                  e.stopPropagation();
                  e.preventDefault();
                  try {
                    await navigator.clipboard.writeText(text);
                    toast.success(`${label} copied!`);
                  } catch (err) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    toast.success(`${label} copied!`);
                  }
                };
                
                return (
                  <Card 
                    key={customer.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900`}
                    onClick={() => navigate(`/customer/${customer.id}`)}
                  >
                    <CardContent className="p-3">
                      {/* Tenant badge when viewing all tenants */}
                      {isViewingAllTenants && customer.tenant_id && (
                        <div className="mb-1.5">
                          <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                            {tenantNames[customer.tenant_id] || 'Unknown Tenant'}
                          </span>
                        </div>
                      )}
                      
                      {/* Row 1: Name + Agent + Price */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {fullName}
                          </h3>
                          {displayAgent && (
                            <span className="text-[9px] font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                              {displayAgent}
                            </span>
                          )}
                          {latestTpv && (
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              tpvCompleted ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            }`}>
                              {statusConfig.label}
                            </span>
                          )}
                        </div>
                        {displayAmount && (
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                            {displayAmount}
                          </span>
                        )}
                      </div>

                      {/* Row 2: Phone + Address with province */}
                      <div className="flex items-center gap-3 text-slate-500 mb-2">
                        <button
                          onClick={(e) => handleCopyToClipboard(e, customer.phone?.replace(/\D/g, ''), 'Phone number')}
                          onContextMenu={(e) => handleCopyToClipboard(e, customer.phone?.replace(/\D/g, ''), 'Phone number')}
                          className="flex items-center gap-1 shrink-0 hover:text-slate-800 transition-colors active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{formatPhoneNumber(customer.phone)}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            const fullAddress = `${customer.address || ''}${customer.city ? `, ${customer.city}` : ''}${customer.province ? `, ${customer.province}` : ''}${customer.postal_code ? ` ${customer.postal_code}` : ''}`;
                            handleCopyToClipboard(e, fullAddress, 'Address');
                          }}
                          onContextMenu={(e) => {
                            const fullAddress = `${customer.address || ''}${customer.city ? `, ${customer.city}` : ''}${customer.province ? `, ${customer.province}` : ''}${customer.postal_code ? ` ${customer.postal_code}` : ''}`;
                            handleCopyToClipboard(e, fullAddress, 'Address');
                          }}
                          className="flex items-center gap-1 min-w-0 flex-1 hover:text-slate-800 transition-colors active:scale-95 text-left"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate text-xs font-medium">
                            {customer.address}{customer.city ? `, ${customer.city}` : ''}{customer.province ? `, ${customer.province}` : ''}
                          </span>
                        </button>
                      </div>
                      
                      {/* Row 3: Products as individual tags */}
                      {latestTpv?.products && (
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          {latestTpv.products.split(',').map((product, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                            >
                              {product.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Row 4: Document badges (compact) */}
                      {(tpvRecording || loanFilled || invoiceFilled || hasIdScan) && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {hasIdScan && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                              <ScanLine className="w-2.5 h-2.5" />
                              ID
                            </span>
                          )}
                          {tpvRecording && (
                            <button
                              onClick={(e) => handleDocumentClick(e, tpvRecording, 'TPV recording')}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                            >
                              <PlayCircle className="w-2.5 h-2.5" />
                              TPV
                            </button>
                          )}
                          {loanFilled && (
                            <button
                              onClick={(e) => handleDocumentClick(e, loanApplication?.document_url, 'loan application')}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                loanSigned 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200' 
                                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                              }`}
                            >
                              <CreditCard className="w-2.5 h-2.5" />
                              Loan{loanSigned ? ' ✓' : ''}
                            </button>
                          )}
                          {invoiceFilled && (
                            <button
                              onClick={(e) => handleDocumentClick(e, invoiceDocument.document_url, 'invoice')}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                invoiceSigned 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200' 
                                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                              }`}
                            >
                              <FileText className="w-2.5 h-2.5" />
                              Invoice{invoiceSigned ? ' ✓' : ''}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Row 5: Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <ActionButton 
                          completed={tpvCompleted}
                          icon={PhoneCall}
                          label={tpvCompleted ? "TPV Complete" : "Start TPV"}
                          onClick={(e) => handleActionClick(e, 'tpv', customer)}
                        />
                        <ActionButton 
                          completed={loanSigned}
                          inProgress={loanFilled && !loanSigned}
                          icon={CreditCard}
                          label={loanSigned ? "Loan Signed" : loanFilled ? "Loan Filled" : "Loan Application"}
                          onClick={(e) => handleActionClick(e, 'loan', customer)}
                        />
                        <ActionButton 
                          completed={invoiceSigned}
                          inProgress={invoiceFilled && !invoiceSigned}
                          icon={FileText}
                          label={invoiceSigned ? "Invoice Signed" : invoiceFilled ? "Invoice Filled" : "Generate Invoice"}
                          onClick={(e) => handleActionClick(e, 'invoice', customer)}
                        />
                        <ActionButton 
                          completed={checklistCompleted}
                          icon={ClipboardCheck}
                          label={checklistCompleted ? "Checklist Complete" : "Checklist"}
                          onClick={(e) => handleActionClick(e, 'checklist', customer)}
                        />
                        <ActionButton 
                          completed={docsSent}
                          icon={Send}
                          label={docsSent ? "Docs Sent" : "Send Docs"}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/${customer.id}`);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
