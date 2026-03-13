import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, User, MapPin, Phone, Package, Send, Loader2,
  CheckCircle, Clock, Truck, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPhoneNumber } from "@/utils/phoneFormat";

const DispatchQueuePage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [selectedContractor, setSelectedContractor] = useState({});
  const [dispatchNotes, setDispatchNotes] = useState({});
  const [filter, setFilter] = useState("undispatched");
  const [search, setSearch] = useState("");
  const agentId = localStorage.getItem("agentId");

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load contractors
      const { data: contractorData } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("is_contractor", true)
        .order("first_name");
      setContractors(contractorData || []);

      // Load all dispatches
      const { data: dispatchData } = await supabase
        .from("job_dispatches")
        .select("*, customers(*)")
        .order("dispatched_at", { ascending: false });
      setDispatches(dispatchData || []);

      // Get customer IDs already dispatched
      const dispatchedCustomerIds = new Set(
        (dispatchData || []).map(d => d.customer_id)
      );

      // Load ALL customers not yet dispatched
      const { data: allCustomers } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      // Load checklist statuses for all customers
      const { data: checklistData } = await supabase
        .from("installation_checklists")
        .select("customer_id, status");

      const checklistMap = {};
      (checklistData || []).forEach(c => {
        if (!checklistMap[c.customer_id] || c.status === 'completed') {
          checklistMap[c.customer_id] = c.status;
        }
      });

      const undispatched = (allCustomers || [])
        .filter(c => !dispatchedCustomerIds.has(c.id))
        .map(c => ({
          ...c,
          checklist_status: checklistMap[c.id] || 'not_started',
        }));

      setCustomers(undispatched);
    } catch (error) {
      console.error("Error loading dispatch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (customerId) => {
    const contractorId = selectedContractor[customerId];
    if (!contractorId) {
      toast.error("Please select a contractor");
      return;
    }

    setDispatchingId(customerId);

    try {
      const customer = customers.find(c => c.id === customerId);

      const { error } = await supabase
        .from("job_dispatches")
        .insert({
          customer_id: customerId,
          tenant_id: customer?.tenant_id || null,
          contractor_agent_id: contractorId,
          dispatched_by: agentId,
          products: customer?.products || null,
          notes: dispatchNotes[customerId] || null,
          status: "dispatched",
        });

      if (error) throw error;
      toast.success("Job dispatched successfully!");
      loadData();
    } catch (error) {
      console.error("Dispatch error:", error);
      toast.error("Failed to dispatch job");
    } finally {
      setDispatchingId(null);
    }
  };

  const getFilteredDispatches = () => {
    let filtered = dispatches;
    if (filter === "dispatched") filtered = dispatches.filter(d => d.status === "dispatched");
    if (filter === "completed") filtered = dispatches.filter(d => d.status === "completed");
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(d => {
        const c = d.customers;
        return (
          c?.first_name?.toLowerCase().includes(s) ||
          c?.last_name?.toLowerCase().includes(s) ||
          c?.address?.toLowerCase().includes(s)
        );
      });
    }
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/landing")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Dispatch Queue
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* Undispatched Jobs */}
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Ready to Dispatch ({customers.length})
          </h2>

          {customers.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No jobs waiting to be dispatched. Jobs appear here after an agent completes the installation checklist.
              </CardContent>
            </Card>
          )}

          {customers.map(customer => (
            <Card key={customer.id} className="mb-3">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {customer.address}, {customer.city}, {customer.province}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {formatPhoneNumber(customer.phone)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                    {customer.checklist_status === 'completed' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                        <CheckCircle className="w-3 h-3 mr-0.5" /> Checklist Done
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                        <Clock className="w-3 h-3 mr-0.5" /> Checklist Incomplete
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select
                    value={selectedContractor[customer.id] || ""}
                    onValueChange={(val) =>
                      setSelectedContractor(prev => ({ ...prev, [customer.id]: val }))
                    }
                  >
                    <SelectTrigger className="flex-1 h-10">
                      <SelectValue placeholder="Select contractor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map(c => (
                        <SelectItem key={c.agent_id} value={c.agent_id}>
                          {c.first_name} {c.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => handleDispatch(customer.id)}
                    disabled={dispatchingId === customer.id || !selectedContractor[customer.id]}
                    className="h-10"
                  >
                    {dispatchingId === customer.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Send className="w-4 h-4 mr-1" /> Dispatch</>
                    )}
                  </Button>
                </div>

                <Textarea
                  placeholder="Add notes for contractor (optional)..."
                  value={dispatchNotes[customer.id] || ""}
                  onChange={(e) =>
                    setDispatchNotes(prev => ({ ...prev, [customer.id]: e.target.value }))
                  }
                  className="text-sm min-h-[60px]"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dispatched Jobs History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
              <Send className="w-4 h-4" />
              Dispatched Jobs ({dispatches.length})
            </h2>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="dispatched">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dispatched jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {getFilteredDispatches().map(dispatch => {
            const contractor = contractors.find(c => c.agent_id === dispatch.contractor_agent_id);
            return (
              <Card key={dispatch.id} className="mb-2">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {dispatch.customers?.first_name} {dispatch.customers?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dispatch.customers?.address}, {dispatch.customers?.city}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        → {contractor ? `${contractor.first_name} ${contractor.last_name}` : dispatch.contractor_agent_id}
                      </p>
                    </div>
                    <Badge className={
                      dispatch.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }>
                      {dispatch.status === "completed" ? "Completed" : "Active"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DispatchQueuePage;
