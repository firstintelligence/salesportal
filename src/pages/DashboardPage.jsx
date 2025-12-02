import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);

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
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {agentId === "MM23" ? "All Customer Deals" : "My Customer Deals"}
            </h1>
            <p className="text-muted-foreground">
              {agentId === "MM23" ? "Viewing all deals from all agents" : `Showing deals for ${getAgentName(agentId)}`}
            </p>
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
