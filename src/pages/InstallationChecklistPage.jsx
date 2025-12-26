import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, User, MapPin, DollarSign, Flame, Home, Sun } from "lucide-react";
import InstallationChecklist from "@/components/checklist/InstallationChecklist";

// Product category groupings
const PRODUCT_CATEGORIES = {
  HVAC: [
    "heat pump", "furnace", "air conditioner", "ac", "hvac", "ductless", 
    "mini split", "boiler", "air handler", "thermostat", "air filter", 
    "air purifier", "humidifier", "dehumidifier", "water heater", 
    "tankless", "hot water"
  ],
  Insulation: [
    "insulation", "attic insulation", "wall insulation", "spray foam", 
    "blown-in", "batt insulation", "weatherization"
  ],
  "Solar/Battery": [
    "solar", "solar panel", "battery", "battery storage", "powerwall", 
    "energy storage", "inverter"
  ],
};

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
    // Supabase returns object for one-to-one, array for one-to-many
    const checklist = Array.isArray(customer.installation_checklists) 
      ? customer.installation_checklists[0] 
      : customer.installation_checklists;
    if (!checklist) return "not_started";
    return checklist.status;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" /> Submitted
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
            <Clock className="w-3 h-3 mr-1" /> Started
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" /> Not Started
          </Badge>
        );
    }
  };

  // Group products by category
  const groupProductsByCategory = (productsString) => {
    if (!productsString) return {};
    
    const products = productsString.split(",").map(p => p.trim().toLowerCase());
    const grouped = {
      HVAC: [],
      Insulation: [],
      "Solar/Battery": [],
    };

    products.forEach((product) => {
      let categorized = false;
      
      for (const [category, keywords] of Object.entries(PRODUCT_CATEGORIES)) {
        if (keywords.some(keyword => product.includes(keyword))) {
          // Use original case from the products string
          const originalProduct = productsString.split(",").find(
            p => p.trim().toLowerCase() === product
          );
          grouped[category].push(originalProduct?.trim() || product);
          categorized = true;
          break;
        }
      }
      
      // If not categorized, put in HVAC by default
      if (!categorized) {
        const originalProduct = productsString.split(",").find(
          p => p.trim().toLowerCase() === product
        );
        grouped.HVAC.push(originalProduct?.trim() || product);
      }
    });

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, items]) => items.length > 0)
    );
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "HVAC":
        return <Flame className="w-3 h-3" />;
      case "Insulation":
        return <Home className="w-3 h-3" />;
      case "Solar/Battery":
        return <Sun className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "HVAC":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
      case "Insulation":
        return "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300";
      case "Solar/Battery":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return null;
    const num = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/landing")}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            Installation Checklist
          </h1>
          <div className="w-8 md:w-16" /> {/* Spacer for centering */}
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">

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
            {customers.map((customer) => {
              const status = getChecklistStatus(customer);
              const groupedProducts = groupProductsByCategory(customer.products);
              const isSubmitted = status === "completed";

              return (
                <Card
                  key={customer.id}
                  className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.01] ${
                    isSubmitted ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        {/* Customer Name & Agent */}
                        <div className="flex items-center gap-2 flex-wrap">
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

                        {/* Address */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{customer.customer_address}, {customer.city}, {customer.province}</span>
                        </div>

                        {/* Products grouped by category */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(groupedProducts).map(([category, products]) => (
                            <div key={category} className="flex items-center gap-1">
                              <Badge 
                                variant="secondary" 
                                className={`${getCategoryColor(category)} text-xs`}
                              >
                                {getCategoryIcon(category)}
                                <span className="ml-1">{category}:</span>
                                <span className="ml-1 font-normal">{products.join(", ")}</span>
                              </Badge>
                            </div>
                          ))}
                          {Object.keys(groupedProducts).length === 0 && (
                            <span className="text-sm text-muted-foreground">No products specified</span>
                          )}
                        </div>
                      </div>

                      {/* Status - Middle */}
                      <div className="flex flex-col items-center gap-2 sm:min-w-[120px]">
                        {getStatusBadge(status)}
                        <span className="text-xs text-muted-foreground">
                          TPV: {new Date(customer.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Deal Size - Right */}
                      <div className="flex flex-col items-end gap-1 sm:min-w-[100px]">
                        {customer.sales_price ? (
                          <>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                              {formatCurrency(customer.sales_price)}
                            </span>
                            <span className="text-xs text-muted-foreground">(incl. tax)</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No price</span>
                        )}
                      </div>
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

export default InstallationChecklistPage;
