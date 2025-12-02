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
              {agentId === "MM23" ? "Viewing all deals from all agents" : `Showing deals for agent ${agentId}`}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {deal.customer_name || `${deal.first_name || ''} ${deal.last_name || ''}`.trim() || "Unnamed Customer"}
                  </CardTitle>
                  {agentId === "MM23" && (
                    <p className="text-sm text-muted-foreground">Agent: {deal.agent_id}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{deal.customer_phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {deal.customer_address || "N/A"}
                      {deal.city && `, ${deal.city}`}
                      {deal.province && `, ${deal.province}`}
                      {deal.postal_code && ` ${deal.postal_code}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Products</p>
                    <p className="text-sm text-muted-foreground">{deal.products || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sales Price</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(deal.sales_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground capitalize">{deal.status || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">{formatDate(deal.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
