import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, Target, Users, Calendar, Package, Percent, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const AGENT_NAMES = {
  MM23: "MoMo",
  TB0195: "Tadeo",
  AA9097: "Donny",
  HB6400: "Harry",
  TP5142: "Tony",
  BB2704: "Bonnie",
};

const AGENT_IDS = ["MM23", "TB0195", "AA9097", "HB6400", "TP5142", "BB2704"];

const MetricsPage = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState("all");

  useEffect(() => {
    const storedAgentId = localStorage.getItem("agentId");
    if (!storedAgentId) {
      navigate("/");
      return;
    }
    setAgentId(storedAgentId);
    const isAdmin = storedAgentId === "MM23";
    setSelectedAgent(isAdmin ? "all" : storedAgentId);
    fetchMetrics(storedAgentId, isAdmin ? "all" : storedAgentId);
  }, [navigate]);

  const handleAgentChange = (value) => {
    setSelectedAgent(value);
    fetchMetrics(agentId, value);
  };

  const fetchMetrics = async (currentAgentId, filterAgent = "all") => {
    try {
      setLoading(true);
      const isAdmin = currentAgentId === "MM23";

      // Fetch TPV requests
      let tpvQuery = supabase.from("tpv_requests").select("*");
      if (!isAdmin) {
        tpvQuery = tpvQuery.eq("agent_id", currentAgentId);
      } else if (filterAgent !== "all") {
        tpvQuery = tpvQuery.eq("agent_id", filterAgent);
      }
      const { data: tpvRequests, error: tpvError } = await tpvQuery;
      
      if (tpvError) throw tpvError;

      // Fetch appointments count (we'll estimate based on created deals)
      let customersQuery = supabase.from("customers").select("*");
      const { data: customers, error: customersError } = await customersQuery;
      
      if (customersError) throw customersError;

      // Calculate metrics
      const calculatedMetrics = calculateMetrics(tpvRequests || [], customers || [], currentAgentId, isAdmin);
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (tpvRequests, customers, currentAgentId, isAdmin) => {
    // Filter completed TPV requests (deals)
    const completedDeals = tpvRequests.filter(r => r.status === "completed");
    const totalDeals = completedDeals.length;
    
    // Calculate total revenue from sales prices
    const totalRevenue = completedDeals.reduce((sum, deal) => {
      const price = parseFloat(deal.sales_price?.replace(/[^0-9.-]+/g, "") || 0);
      return sum + price;
    }, 0);

    // Average deal value
    const averageDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;

    // Count total units (products per deal)
    let totalUnits = 0;
    completedDeals.forEach(deal => {
      if (deal.products) {
        // Count comma-separated products or assume 1 if single product
        const productCount = deal.products.split(",").length;
        totalUnits += productCount;
      }
    });
    const unitsPerDeal = totalDeals > 0 ? totalUnits / totalDeals : 0;

    // Estimate appointments (all TPV requests represent appointments visited)
    const totalAppointments = tpvRequests.length;
    
    // Appointments per deal (how many visits to close)
    const appointmentsPerDeal = totalDeals > 0 ? totalAppointments / totalDeals : 0;

    // Revenue per appointment
    const revenuePerAppointment = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    // Closing rate (completed deals / total appointments)
    const closingRate = totalAppointments > 0 ? (totalDeals / totalAppointments) * 100 : 0;

    // Presentation rate (assume all TPV requests = presentations made)
    // For now, we'll use initiated + completed as presentations
    const presentations = tpvRequests.filter(r => r.status === "completed" || r.status === "initiated").length;
    const presentationRate = totalAppointments > 0 ? (presentations / totalAppointments) * 100 : 0;

    // Calculate days active (from first deal to now)
    const sortedDeals = [...completedDeals].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );
    const firstDealDate = sortedDeals.length > 0 ? new Date(sortedDeals[0].created_at) : new Date();
    const daysActive = Math.max(1, Math.ceil((new Date() - firstDealDate) / (1000 * 60 * 60 * 24)));

    // Projected annual earnings (10% commission projected for year)
    const dailyEarnings = (totalRevenue * 0.10) / daysActive;
    const projectedAnnualEarnings = dailyEarnings * 365;

    // Average deal cycle time (days between TPV requests)
    const avgDealCycleTime = totalDeals > 1 ? daysActive / totalDeals : 0;

    // This month's performance
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthDeals = completedDeals.filter(d => new Date(d.created_at) >= thisMonthStart);
    const thisMonthRevenue = thisMonthDeals.reduce((sum, deal) => {
      const price = parseFloat(deal.sales_price?.replace(/[^0-9.-]+/g, "") || 0);
      return sum + price;
    }, 0);

    return {
      totalDeals,
      totalRevenue,
      averageDealValue,
      unitsPerDeal,
      totalAppointments,
      appointmentsPerDeal,
      revenuePerAppointment,
      closingRate,
      presentationRate,
      projectedAnnualEarnings,
      avgDealCycleTime,
      thisMonthDeals: thisMonthDeals.length,
      thisMonthRevenue,
      daysActive,
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value, decimals = 1) => {
    return value.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 flex items-center justify-center">
        <div className="text-muted-foreground">Loading metrics...</div>
      </div>
    );
  }

  const agentName = AGENT_NAMES[agentId] || agentId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/landing")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Performance Metrics
              </h1>
              <p className="text-muted-foreground">
                {selectedAgent === "all" 
                  ? "All Agents Overview" 
                  : `${AGENT_NAMES[selectedAgent] || selectedAgent}'s Performance`}
              </p>
            </div>
            
            {agentId === "MM23" && (
              <Select value={selectedAgent} onValueChange={handleAgentChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {AGENT_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {AGENT_NAMES[id]} ({id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics?.totalRevenue || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics?.totalDeals || 0} deals closed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Avg Deal Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics?.averageDealValue || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">per closed deal</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Closing Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatPercent(metrics?.closingRate || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">of appointments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Projected Annual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics?.projectedAnnualEarnings || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">at 10% commission</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Revenue per Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatCurrency(metrics?.revenuePerAppointment || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                From {metrics?.totalAppointments || 0} total appointments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Appointments per Deal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatNumber(metrics?.appointmentsPerDeal || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average visits to close
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Presentation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatPercent(metrics?.presentationRate || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Appointments with presentations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Units per Deal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatNumber(metrics?.unitsPerDeal || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average equipment pieces sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Avg Deal Cycle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatNumber(metrics?.avgDealCycleTime || 0, 0)} days</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average time between deals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatCurrency(metrics?.thisMonthRevenue || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.thisMonthDeals || 0} deals this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {metrics?.closingRate >= 50 ? (
                <p className="text-green-600 dark:text-green-400">
                  ✓ Excellent closing rate! You're converting over half your appointments.
                </p>
              ) : metrics?.closingRate >= 25 ? (
                <p className="text-amber-600 dark:text-amber-400">
                  → Good closing rate. Focus on qualifying leads better to improve.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  → Work on improving your closing rate through better presentations.
                </p>
              )}
              
              {metrics?.unitsPerDeal >= 2 ? (
                <p className="text-green-600 dark:text-green-400">
                  ✓ Great job bundling! Averaging {formatNumber(metrics?.unitsPerDeal)} units per deal.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  → Try bundling more products per deal to increase average deal value.
                </p>
              )}

              {metrics?.appointmentsPerDeal <= 1.5 ? (
                <p className="text-green-600 dark:text-green-400">
                  ✓ Efficient closer! Low appointment-to-deal ratio.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  → Consider improving your one-call close rate.
                </p>
              )}

              <p className="text-muted-foreground pt-2 border-t">
                Active for {metrics?.daysActive || 0} days • 
                Earning potential: {formatCurrency((metrics?.projectedAnnualEarnings || 0) / 12)}/month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsPage;
