import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, User, MapPin, Package } from "lucide-react";
import InstallationChecklist from "@/components/checklist/InstallationChecklist";

const InstallationChecklistPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const agentId = localStorage.getItem("agentId");
  const isAdmin = agentId === "MM23";

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
      return;
    }
    fetchCustomers();
  }, [navigate]);

  const fetchCustomers = async () => {
    try {
      let query = supabase
        .from("tpv_requests")
        .select(`
          *,
          installation_checklists (
            id,
            status,
            submitted_at
          )
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      // Only filter by agent if not admin
      if (!isAdmin) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChecklistStatus = (customer) => {
    const checklist = customer.installation_checklists?.[0];
    if (!checklist) return "not_started";
    return checklist.status;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Not Started</Badge>;
    }
  };

  const parseProducts = (productsString) => {
    if (!productsString) return [];
    return productsString.split(",").map(p => p.trim());
  };

  if (selectedCustomer) {
    return (
      <InstallationChecklist
        customer={selectedCustomer}
        onBack={() => {
          setSelectedCustomer(null);
          fetchCustomers();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/landing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Installation Checklist
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "All completed TPV customers" : "Your completed TPV customers"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No completed TPV customers found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card
                key={customer.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                onClick={() => setSelectedCustomer(customer)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {customer.first_name} {customer.last_name}
                        </span>
                        {isAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Agent: {customer.agent_id}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{customer.customer_address}, {customer.city}, {customer.province}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4" />
                        <span>{customer.products || "No products specified"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(getChecklistStatus(customer))}
                      <span className="text-xs text-muted-foreground">
                        TPV: {new Date(customer.created_at).toLocaleDateString()}
                      </span>
                    </div>
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

export default InstallationChecklistPage;
