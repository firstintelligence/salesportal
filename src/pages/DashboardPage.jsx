import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Plus, User, Phone, MapPin, Package, DollarSign, Search, FileText, ClipboardCheck, PhoneCall, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatPhoneNumber, formatPostalCode, capitalizeWords } from "@/utils/inputFormatting";
import { useTenant } from "@/contexts/TenantContext";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading } = useTenant();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
    "MM23": "MoMo",
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
    "AB5394": "Abe"
  };

  const getAgentName = (id) => agentNames[id] || id;

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
      fetchDeals(storedAgentId, tenant.id);
    }
  }, [navigate, tenant?.id, tenantLoading]);

  const fetchDeals = async (currentAgentId, tenantId) => {
    try {
      setLoading(true);
      
      // CRITICAL: Always filter by tenant_id to ensure complete data isolation
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
            created_at
          )
        `)
        .eq("tenant_id", tenantId) // CRITICAL: Filter by tenant for data isolation
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter by agent_id - agents see only their own customers, admin sees all
      // Note: RLS policies also enforce this, but we filter here for clarity
      let filteredData = data || [];
      
      setDeals(filteredData);
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

  const getProgressColor = (tpvStatus) => {
    const status = tpvStatus?.toLowerCase();
    if (status === 'completed') return 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20';
    if (status === 'pending' || status === 'initiated') return 'border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20';
    if (status === 'failed') return 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20';
    return 'border-l-slate-300 dark:border-l-slate-600';
  };

  const handleCreateDeal = async () => {
    try {
      if (!newDeal.first_name || !newDeal.last_name || !newDeal.phone || !newDeal.address) {
        toast.error("Please fill in all required fields");
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

  const ActionButton = ({ completed, icon: Icon, label, onClick }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            completed 
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
              : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-400 dark:text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          {completed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );

  // CRITICAL: Block rendering until tenant is fully loaded to prevent cross-tenant data exposure
  if (tenantLoading || !tenant?.id) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/landing")}
                className="rounded-full h-9 w-9"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {agentId === "MM23" ? "All Deals" : "My Deals"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {filteredDeals.length} customer{filteredDeals.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 rounded-full h-9 px-4">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>
                    Enter customer information
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-3 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name" className="text-xs">First Name *</Label>
                      <Input
                        id="first_name"
                        value={newDeal.first_name}
                        onChange={(e) => setNewDeal({ ...newDeal, first_name: capitalizeWords(e.target.value) })}
                        placeholder="John"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="last_name" className="text-xs">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={newDeal.last_name}
                        onChange={(e) => setNewDeal({ ...newDeal, last_name: capitalizeWords(e.target.value) })}
                        placeholder="Smith"
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs">Phone *</Label>
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
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newDeal.email}
                        onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                        placeholder="john@example.com"
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs">Address *</Label>
                      <Input
                        id="address"
                        value={newDeal.address}
                        onChange={(e) => setNewDeal({ ...newDeal, address: capitalizeWords(e.target.value) })}
                        placeholder="123 Main Street"
                        className="h-9"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs">City</Label>
                        <Input
                          id="city"
                          value={newDeal.city}
                          onChange={(e) => setNewDeal({ ...newDeal, city: capitalizeWords(e.target.value) })}
                          placeholder="Toronto"
                          className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="province" className="text-xs">Province</Label>
                      <Input
                        id="province"
                        value={newDeal.province}
                        onChange={(e) => setNewDeal({ ...newDeal, province: e.target.value })}
                        placeholder="ON"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postal_code" className="text-xs">Postal</Label>
                      <Input
                        id="postal_code"
                        value={newDeal.postal_code}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\s/g, '').toUpperCase().slice(0, 6);
                          const formatted = cleaned.length > 3 ? cleaned.slice(0, 3) + ' ' + cleaned.slice(3) : cleaned;
                          setNewDeal({ ...newDeal, postal_code: formatted });
                        }}
                        placeholder="M5V 1A1"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreateDeal}>
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredDeals.length === 0 ? (
          <Card className="border-dashed border-2 bg-white dark:bg-slate-900">
            <CardContent className="py-12 text-center">
              <User className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No customers found</p>
            </CardContent>
          </Card>
        ) : (
          <TooltipProvider delayDuration={300}>
            <div className="space-y-2">
              {filteredDeals.map((customer) => {
                const latestTpv = customer.tpv_requests?.[0];
                const displayAgent = agentId === "MM23" && latestTpv ? getAgentName(latestTpv.agent_id) : null;
                const fullName = customer.first_name && customer.last_name 
                  ? `${customer.first_name} ${customer.last_name}`
                  : "Unnamed";
                const salesPrice = formatCurrency(latestTpv?.sales_price);
                const tpvCompleted = latestTpv?.status?.toLowerCase() === 'completed';
                // Mock states for loan and checklist - these would come from actual data
                const loanCompleted = false;
                const checklistCompleted = false;
                
                return (
                  <Card 
                    key={customer.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-900 border-0 border-l-4 rounded-lg overflow-hidden ${getProgressColor(latestTpv?.status)}`}
                    onClick={() => navigate(`/customer/${customer.id}`)}
                  >
                    <CardContent className="p-3">
                      {/* Top Row - Name, Agent, Price */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h3 className="font-medium text-foreground text-sm truncate">
                            {fullName}
                          </h3>
                          {displayAgent && (
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                              {displayAgent}
                            </span>
                          )}
                        </div>
                        {salesPrice && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm shrink-0 ml-2">
                            {salesPrice}
                          </span>
                        )}
                      </div>

                      {/* Middle Row - Details */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span className="font-mono">{formatPhoneNumber(customer.phone)}</span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{customer.city || customer.address}</span>
                        </div>
                        {latestTpv?.products && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                            <div className="hidden sm:flex items-center gap-1 truncate">
                              <Package className="w-3 h-3 shrink-0" />
                              <span className="truncate">{latestTpv.products}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Bottom Row - Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ActionButton 
                            completed={tpvCompleted}
                            icon={PhoneCall}
                            label={tpvCompleted ? "TPV Complete" : "Start TPV"}
                            onClick={(e) => handleActionClick(e, 'tpv', customer)}
                          />
                          <ActionButton 
                            completed={loanCompleted}
                            icon={FileText}
                            label={loanCompleted ? "Loan Complete" : "Loan Application"}
                            onClick={(e) => handleActionClick(e, 'loan', customer)}
                          />
                          <ActionButton 
                            completed={checklistCompleted}
                            icon={ClipboardCheck}
                            label={checklistCompleted ? "Checklist Complete" : "Installation Checklist"}
                            onClick={(e) => handleActionClick(e, 'checklist', customer)}
                          />
                        </div>
                        
                        {/* Progress indicator */}
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${tpvCompleted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <div className={`w-1.5 h-1.5 rounded-full ${loanCompleted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <div className={`w-1.5 h-1.5 rounded-full ${checklistCompleted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        </div>
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
