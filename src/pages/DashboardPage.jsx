import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
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
      
      // Fetch customers with their related TPV data
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
      
      // Filter by agent if not admin
      // MM23 (admin) sees ALL deals (past and future)
      // Other agents only see their own deals
      let filteredData = data || [];
      if (currentAgentId !== "MM23") {
        // Regular agents: only show customers where they have at least one TPV request
        filteredData = filteredData.filter(customer => 
          customer.tpv_requests && customer.tpv_requests.some(tpv => tpv.agent_id === currentAgentId)
        );
      }
      // Admin sees all customers, even those without TPV yet
      
      setDeals(filteredData);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateDeal = async () => {
    try {
      // Validate required fields
      if (!newDeal.first_name || !newDeal.last_name || !newDeal.phone || !newDeal.address) {
        toast.error("Please fill in all required fields (First Name, Last Name, Phone, Address)");
        return;
      }

      // Create new customer
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

      toast.success("New deal created successfully!");
      setIsCreateDialogOpen(false);
      
      // Reset form
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

      // Navigate to the new customer's detail page
      navigate(`/customer/${customer.id}`);
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create new deal. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/landing")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Button>
          
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {agentId === "MM23" ? "All Customer Deals" : "My Customer Deals"}
              </h1>
              <p className="text-muted-foreground">
                {agentId === "MM23" ? "Viewing all deals from all agents" : `Showing deals for ${getAgentName(agentId)}`}
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>
                    Enter customer information to create a new deal profile
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No customer deals found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                      {agentId === "MM23" && (
                        <th className="px-4 py-3 text-left text-sm font-semibold">Agent</th>
                      )}
                      <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Products</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Sales Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((customer) => {
                      const latestTpv = customer.tpv_requests?.[0];
                      const displayAgent = agentId === "MM23" && latestTpv ? getAgentName(latestTpv.agent_id) : null;
                      
                      return (
                        <tr 
                          key={customer.id} 
                          className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/customer/${customer.id}`)}
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            {customer.first_name && customer.last_name 
                              ? `${customer.first_name} ${customer.last_name}`
                              : "Unnamed Customer"}
                          </td>
                          {agentId === "MM23" && (
                            <td className="px-4 py-3 text-sm text-muted-foreground">{displayAgent || "N/A"}</td>
                          )}
                          <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {customer.address || "N/A"}
                            {customer.city && `, ${customer.city}`}
                            {customer.province && `, ${customer.province}`}
                            {customer.postal_code && ` ${customer.postal_code}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{latestTpv?.products || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(latestTpv?.sales_price)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{latestTpv?.status || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(customer.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
