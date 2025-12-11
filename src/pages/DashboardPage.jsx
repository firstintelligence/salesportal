import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Plus, User, Phone, MapPin, Package, DollarSign, Calendar, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DashboardPage = () => {
  const navigate = useNavigate();
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
    "TP5142": "Tony"
  };

  const getAgentName = (id) => {
    return agentNames[id] || id;
  };

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    const storedAgentId = localStorage.getItem("agentId");
    
    if (!authenticated) {
      navigate("/");
      return;
    }
    
    setAgentId(storedAgentId);
    fetchDeals(storedAgentId);
  }, [navigate]);

  const fetchDeals = async (currentAgentId) => {
    try {
      setLoading(true);
      
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
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = data || [];
      if (currentAgentId !== "MM23") {
        filteredData = filteredData.filter(customer => 
          customer.tpv_requests && customer.tpv_requests.some(tpv => tpv.agent_id === currentAgentId)
        );
      }
      
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

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const handleCreateDeal = async () => {
    try {
      if (!newDeal.first_name || !newDeal.last_name || !newDeal.phone || !newDeal.address) {
        toast.error("Please fill in all required fields");
        return;
      }

      const { data: customer, error } = await supabase
        .from("customers")
        .insert([{
          first_name: newDeal.first_name.trim(),
          last_name: newDeal.last_name.trim(),
          phone: newDeal.phone.trim(),
          email: newDeal.email.trim() || null,
          address: newDeal.address.trim(),
          city: newDeal.city.trim() || null,
          province: newDeal.province.trim() || null,
          postal_code: newDeal.postal_code.trim() || null
        }])
        .select()
        .single();

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

      navigate(`/customer/${customer.id}`);
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create new deal");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/landing")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {agentId === "MM23" ? "All Deals" : "My Deals"}
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {filteredDeals.length} customer{filteredDeals.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full shadow-lg">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Deal</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>
                    Enter customer information to create a new deal
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={newDeal.first_name}
                        onChange={(e) => setNewDeal({ ...newDeal, first_name: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={newDeal.last_name}
                        onChange={(e) => setNewDeal({ ...newDeal, last_name: e.target.value })}
                        placeholder="Smith"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={newDeal.phone}
                        onChange={(e) => setNewDeal({ ...newDeal, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newDeal.email}
                        onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={newDeal.address}
                      onChange={(e) => setNewDeal({ ...newDeal, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newDeal.city}
                        onChange={(e) => setNewDeal({ ...newDeal, city: e.target.value })}
                        placeholder="Toronto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={newDeal.province}
                        onChange={(e) => setNewDeal({ ...newDeal, province: e.target.value })}
                        placeholder="ON"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={newDeal.postal_code}
                        onChange={(e) => setNewDeal({ ...newDeal, postal_code: e.target.value })}
                        placeholder="M5V 1A1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDeal}>
                    Create Deal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDeals.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No customers found</p>
              <p className="text-muted-foreground/70 text-sm">Create your first deal to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredDeals.map((customer) => {
              const latestTpv = customer.tpv_requests?.[0];
              const displayAgent = agentId === "MM23" && latestTpv ? getAgentName(latestTpv.agent_id) : null;
              const fullName = customer.first_name && customer.last_name 
                ? `${customer.first_name} ${customer.last_name}`
                : "Unnamed Customer";
              const salesPrice = formatCurrency(latestTpv?.sales_price);
              
              return (
                <Card 
                  key={customer.id}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  onClick={() => navigate(`/customer/${customer.id}`)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-lg sm:text-xl font-bold text-primary">
                            {customer.first_name?.[0]?.toUpperCase() || 'C'}
                          </span>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
                              {fullName}
                            </h3>
                            {displayAgent && (
                              <span className="text-xs text-muted-foreground">Agent: {displayAgent}</span>
                            )}
                          </div>
                          {latestTpv?.status && (
                            <Badge variant="secondary" className={`${getStatusColor(latestTpv.status)} text-xs font-medium capitalize shrink-0`}>
                              {latestTpv.status}
                            </Badge>
                          )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          )}
                          
                          {customer.address && (
                            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2 sm:col-span-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{customer.city || customer.address}</span>
                            </div>
                          )}

                          {latestTpv?.products && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Package className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{latestTpv.products}</span>
                            </div>
                          )}

                          {salesPrice && (
                            <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="w-3.5 h-3.5 shrink-0" />
                              <span>{salesPrice}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
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

export default DashboardPage;
