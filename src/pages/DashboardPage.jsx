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
      let query = supabase
        .from("tpv_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // If not admin MM23, filter by agent_id
      if (currentAgentId !== "MM23") {
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
                    {deals.map((deal) => (
                      <tr key={deal.id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-sm font-medium">
                          {deal.customer_name || `${deal.first_name || ''} ${deal.last_name || ''}`.trim() || "Unnamed Customer"}
                        </td>
                        {agentId === "MM23" && (
                          <td className="px-4 py-3 text-sm text-muted-foreground">{getAgentName(deal.agent_id)}</td>
                        )}
                        <td className="px-4 py-3 text-sm text-muted-foreground">{deal.customer_phone || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {deal.customer_address || "N/A"}
                          {deal.city && `, ${deal.city}`}
                          {deal.province && `, ${deal.province}`}
                          {deal.postal_code && ` ${deal.postal_code}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{deal.products || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(deal.sales_price)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{deal.status || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(deal.created_at)}</td>
                      </tr>
                    ))}
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
