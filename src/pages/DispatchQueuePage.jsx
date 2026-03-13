import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, User, MapPin, Phone, Send, Loader2,
  CheckCircle, Clock, Truck, Search, X, Package
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPhoneNumber } from "@/utils/phoneFormat";

const DispatchQueuePage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [filter, setFilter] = useState("undispatched");
  const [search, setSearch] = useState("");
  const agentId = localStorage.getItem("agentId");

  // Dispatch modal state
  const [dispatchModal, setDispatchModal] = useState(null); // customer object or null
  const [modalContractor, setModalContractor] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalSelectedProducts, setModalSelectedProducts] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: contractorData } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("is_contractor", true)
        .order("first_name");
      setContractors(contractorData || []);

      const { data: dispatchData } = await supabase
        .from("job_dispatches")
        .select("*, customers(*)")
        .order("dispatched_at", { ascending: false });
      setDispatches(dispatchData || []);

      const dispatchedCustomerIds = new Set(
        (dispatchData || []).map(d => d.customer_id)
      );

      const { data: allCustomers } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      // Load checklist statuses
      const { data: checklistData } = await supabase
        .from("installation_checklists")
        .select("customer_id, status");

      const checklistMap = {};
      (checklistData || []).forEach(c => {
        if (!checklistMap[c.customer_id] || c.status === 'completed') {
          checklistMap[c.customer_id] = c.status;
        }
      });

      // Load products from TPV requests
      const { data: tpvData } = await supabase
        .from("tpv_requests")
        .select("customer_id, products, items_json");

      const productMap = {};
      (tpvData || []).forEach(t => {
        if (t.customer_id && t.products) {
          // Merge products from multiple TPV requests
          const existing = productMap[t.customer_id] || new Set();
          t.products.split(",").map(p => p.trim()).filter(Boolean).forEach(p => existing.add(p));
          productMap[t.customer_id] = existing;
        }
        // Also check items_json for custom products
        if (t.customer_id && t.items_json) {
          const existing = productMap[t.customer_id] || new Set();
          const items = Array.isArray(t.items_json) ? t.items_json : [];
          items.forEach(item => {
            if (item?.name || item?.product) {
              existing.add(item.name || item.product);
            }
          });
          productMap[t.customer_id] = existing;
        }
      });

      const undispatched = (allCustomers || [])
        .filter(c => !dispatchedCustomerIds.has(c.id))
        .map(c => ({
          ...c,
          checklist_status: checklistMap[c.id] || 'not_started',
          products: productMap[c.id] ? Array.from(productMap[c.id]) : [],
        }));

      setCustomers(undispatched);
    } catch (error) {
      console.error("Error loading dispatch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDispatchModal = (customer) => {
    setDispatchModal(customer);
    setModalContractor("");
    setModalNotes("");
    setModalSelectedProducts(customer.products?.length ? [...customer.products] : []);
  };

  const handleDispatch = async () => {
    if (!modalContractor) {
      toast.error("Please select a contractor");
      return;
    }
    if (modalSelectedProducts.length === 0 && dispatchModal.products?.length > 0) {
      toast.error("Please select at least one product to dispatch");
      return;
    }

    const customer = dispatchModal;
    setDispatchingId(customer.id);

    try {
      const { error } = await supabase
        .from("job_dispatches")
        .insert({
          customer_id: customer.id,
          tenant_id: customer.tenant_id || null,
          contractor_agent_id: modalContractor,
          dispatched_by: agentId,
          products: modalSelectedProducts.join(", ") || null,
          notes: modalNotes || null,
          status: "dispatched",
        });

      if (error) throw error;
      toast.success("Job dispatched successfully!");
      setDispatchModal(null);
      loadData();
    } catch (error) {
      console.error("Dispatch error:", error);
      toast.error("Failed to dispatch job");
    } finally {
      setDispatchingId(null);
    }
  };

  const toggleProduct = (product) => {
    setModalSelectedProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
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
                No jobs waiting to be dispatched.
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {customers.map(customer => (
              <Card
                key={customer.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openDispatchModal(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {customer.address}{customer.city ? `, ${customer.city}` : ""}{customer.province ? `, ${customer.province}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        {formatPhoneNumber(customer.phone)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
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
                  {/* Product Tags */}
                  {customer.products?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {customer.products.map((product, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs font-medium bg-slate-200 text-slate-700"
                        >
                          <Package className="w-3 h-3 mr-1" />
                          {product}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Dispatched Jobs History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
              <Send className="w-4 h-4" />
              Dispatched Jobs ({dispatches.length})
            </h2>
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
            const dispatchProducts = dispatch.products ? dispatch.products.split(",").map(p => p.trim()).filter(Boolean) : [];
            return (
              <Card key={dispatch.id} className="mb-2">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {dispatch.customers?.first_name} {dispatch.customers?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dispatch.customers?.address}{dispatch.customers?.city ? `, ${dispatch.customers.city}` : ""}
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
                  {dispatchProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {dispatchProducts.map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] bg-slate-200 text-slate-600">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dispatch Modal */}
      <Dialog open={!!dispatchModal} onOpenChange={(open) => !open && setDispatchModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Dispatch Job
            </DialogTitle>
          </DialogHeader>

          {dispatchModal && (
            <div className="space-y-4">
              {/* Customer summary */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-sm">
                  {dispatchModal.first_name} {dispatchModal.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dispatchModal.address}{dispatchModal.city ? `, ${dispatchModal.city}` : ""}{dispatchModal.province ? `, ${dispatchModal.province}` : ""}
                </p>
              </div>

              {/* Product selection */}
              {dispatchModal.products?.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Select products to dispatch
                  </label>
                  <div className="space-y-2">
                    {dispatchModal.products.map((product, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={modalSelectedProducts.includes(product)}
                          onCheckedChange={() => toggleProduct(product)}
                        />
                        <span className="text-sm">{product}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Contractor selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Assign contractor</label>
                <Select value={modalContractor} onValueChange={setModalContractor}>
                  <SelectTrigger className="h-10">
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
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
                <Textarea
                  placeholder="Add notes for contractor..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="text-sm min-h-[70px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDispatch}
              disabled={dispatchingId || !modalContractor}
            >
              {dispatchingId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Send className="w-4 h-4 mr-1" /> Dispatch</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatchQueuePage;
