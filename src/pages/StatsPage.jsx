import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, Target, Users, Calendar, Package, Percent, Award, Trophy, Crown, Medal, Star, Flame, Zap, Sparkles, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

// Demo data for Polaron agents
const POLARON_DEMO_STATS = {
  CI11: { weeklyRevenue: 45000, totalRevenue: 187500, deals: 12 },
  LA11: { weeklyRevenue: 38000, totalRevenue: 156000, deals: 10 },
  AW11: { weeklyRevenue: 52000, totalRevenue: 215000, deals: 14 },
  MA11: { weeklyRevenue: 41000, totalRevenue: 168000, deals: 11 },
  MW11: { weeklyRevenue: 35000, totalRevenue: 142000, deals: 9 },
};

const PROMOTION_TIERS = [
  { name: "Rookie", minRevenue: 0, maxRevenue: 25000, color: "from-slate-400 to-slate-600", bgColor: "bg-slate-500", icon: Star, bonus: "Base Commission" },
  { name: "Rising Star", minRevenue: 25000, maxRevenue: 50000, color: "from-blue-400 to-blue-600", bgColor: "bg-blue-500", icon: Zap, bonus: "+1% Commission" },
  { name: "Pro Closer", minRevenue: 50000, maxRevenue: 100000, color: "from-purple-400 to-purple-600", bgColor: "bg-purple-500", icon: Flame, bonus: "+2% Commission" },
  { name: "Elite", minRevenue: 100000, maxRevenue: 200000, color: "from-amber-400 to-orange-500", bgColor: "bg-amber-500", icon: Medal, bonus: "+3% + $500 Bonus" },
  { name: "Champion", minRevenue: 200000, maxRevenue: 500000, color: "from-yellow-400 to-amber-500", bgColor: "bg-yellow-500", icon: Trophy, bonus: "+4% + $1000 Bonus" },
  { name: "Legend", minRevenue: 500000, maxRevenue: Infinity, color: "from-yellow-300 via-amber-400 to-orange-500", bgColor: "bg-gradient-to-r from-yellow-400 to-orange-500", icon: Crown, bonus: "+5% + $2500 Bonus" },
];

const StatCard = ({ icon: Icon, iconColor, title, value, subtitle, gradient, delay = 0 }) => (
  <Card 
    className={`relative overflow-hidden border-0 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${gradient}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 opacity-10">
      <Icon className="w-full h-full" />
    </div>
    <CardHeader className="pb-1 pt-3 px-3 md:pb-2 md:pt-4 md:px-4 lg:pt-6 lg:px-6">
      <CardTitle className="text-[10px] md:text-xs lg:text-sm font-medium text-foreground/70 flex items-center gap-1.5 md:gap-2">
        <div className={`p-1 md:p-1.5 lg:p-2 rounded-md lg:rounded-lg ${iconColor}`}>
          <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-white" />
        </div>
        <span className="truncate">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="pb-3 px-3 md:pb-4 md:px-4 lg:pb-6 lg:px-6">
      <p className="text-lg md:text-xl lg:text-3xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 lg:mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

const LeaderboardRow = ({ agent, index, isCurrentUser, formatCurrency }) => {
  const TierIcon = agent.tier.icon;
  const rankStyles = {
    0: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-yellow-400/50 shadow-md md:shadow-lg",
    1: "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-slate-400/30 shadow-sm md:shadow-md",
    2: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-amber-600/30 shadow-sm md:shadow-md",
  };

  return (
    <div 
      className={`flex items-center gap-2 md:gap-3 lg:gap-4 p-2.5 md:p-3 lg:p-5 transition-all duration-300 ${
        isCurrentUser 
          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary" 
          : "hover:bg-muted/50"
      } ${index === 0 ? "bg-gradient-to-r from-yellow-500/5 to-transparent" : ""}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Rank Badge */}
      <div className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center font-bold text-sm md:text-base lg:text-lg transition-transform hover:scale-110 ${
        rankStyles[index] || "bg-muted text-muted-foreground"
      }`}>
        {index === 0 ? (
          <Crown className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white drop-shadow" />
        ) : index === 1 ? (
          <span className="text-slate-600 font-black">2</span>
        ) : index === 2 ? (
          <span className="text-white font-black">3</span>
        ) : (
          <span className="font-semibold">{index + 1}</span>
        )}
      </div>

      {/* Agent Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 md:gap-2">
          <p className={`font-bold text-sm md:text-base truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
            {agent.name}
          </p>
          {isCurrentUser && (
            <span className="text-[8px] md:text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full font-medium">YOU</span>
          )}
          {index === 0 && (
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-4 h-4 md:w-5 md:h-5 rounded-md bg-gradient-to-br ${agent.tier.color} flex items-center justify-center`}>
            <TierIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{agent.tier.name}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="font-bold text-foreground text-sm md:text-base lg:text-lg">{formatCurrency(agent.weeklyRevenue)}</p>
        <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-muted-foreground font-medium">This Week</p>
      </div>
      <div className="text-right min-w-[70px] md:min-w-[90px] lg:min-w-[110px] hidden md:block">
        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm md:text-base">{formatCurrency(agent.projectedAnnual)}</p>
        <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Annual</p>
      </div>
    </div>
  );
};

const StatsPage = () => {
  const navigate = useNavigate();
  const { tenant, agentProfile, isSuperAdmin } = useTenant();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [leaderboard, setLeaderboard] = useState([]);
  const [allTpvRequests, setAllTpvRequests] = useState([]);
  const [tenantAgents, setTenantAgents] = useState([]);
  const [agentNames, setAgentNames] = useState({});

  useEffect(() => {
    const storedAgentId = localStorage.getItem("agentId");
    if (!storedAgentId) {
      navigate("/");
      return;
    }
    setAgentId(storedAgentId);
    setSelectedAgent("all");
    fetchTenantAgents(storedAgentId);
  }, [navigate]);

  const fetchTenantAgents = async (currentAgentId) => {
    try {
      setLoading(true);
      
      // First, get the current agent's tenant
      const { data: currentAgent, error: agentError } = await supabase
        .from("agent_profiles")
        .select("*, tenants(*)")
        .eq("agent_id", currentAgentId)
        .single();
      
      if (agentError) {
        console.error("Error fetching agent:", agentError);
        navigate("/landing");
        return;
      }
      
      // Get all agents from the same tenant
      const { data: agents, error: agentsError } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("tenant_id", currentAgent.tenant_id);
      
      if (agentsError) throw agentsError;
      
      const agentIds = agents.map(a => a.agent_id);
      const names = {};
      agents.forEach(a => {
        names[a.agent_id] = a.first_name;
      });
      
      setTenantAgents(agentIds);
      setAgentNames(names);
      
      // Check if this is Polaron tenant (use demo data)
      const isPolaron = currentAgent.tenants?.slug === 'polaron';
      
      if (isPolaron) {
        // Use demo data for Polaron
        const demoLeaderboard = agentIds
          .filter(id => POLARON_DEMO_STATS[id])
          .map(id => {
            const stats = POLARON_DEMO_STATS[id];
            const dailySales = stats.totalRevenue / 30; // Assume 30 days active
            const projectedAnnual = dailySales * 365;
            return {
              id,
              name: names[id],
              weeklyRevenue: stats.weeklyRevenue,
              totalRevenue: stats.totalRevenue,
              projectedAnnual,
              tier: getCurrentTier(stats.totalRevenue),
            };
          })
          .sort((a, b) => b.weeklyRevenue - a.weeklyRevenue);
        
        setLeaderboard(demoLeaderboard);
        
        // Calculate demo metrics for all agents
        const totalRevenue = Object.values(POLARON_DEMO_STATS).reduce((sum, s) => sum + s.totalRevenue, 0);
        const totalDeals = Object.values(POLARON_DEMO_STATS).reduce((sum, s) => sum + s.deals, 0);
        const weeklyRevenue = Object.values(POLARON_DEMO_STATS).reduce((sum, s) => sum + s.weeklyRevenue, 0);
        
        setMetrics({
          totalDeals,
          totalRevenue,
          averageDealValue: totalRevenue / totalDeals,
          unitsPerDeal: 1.5,
          totalAppointments: totalDeals * 1.3,
          appointmentsPerDeal: 1.3,
          revenuePerAppointment: totalRevenue / (totalDeals * 1.3),
          closingRate: 77,
          presentationRate: 85,
          projectedAnnualEarnings: (totalRevenue * 0.10 / 30) * 365,
          avgDealCycleTime: 3.2,
          thisMonthDeals: totalDeals,
          thisMonthRevenue: weeklyRevenue * 4,
          daysActive: 30,
        });
        setAllTpvRequests([]);
      } else {
        // Fetch real data for other tenants
        fetchAllData(currentAgentId, agentIds, names);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tenant agents:", error);
      setLoading(false);
    }
  };

  const handleAgentChange = (value) => {
    setSelectedAgent(value);
    
    // Check if using demo data (Polaron)
    const isPolaron = tenant?.slug === 'polaron';
    
    if (isPolaron && value !== "all" && POLARON_DEMO_STATS[value]) {
      const stats = POLARON_DEMO_STATS[value];
      setMetrics({
        totalDeals: stats.deals,
        totalRevenue: stats.totalRevenue,
        averageDealValue: stats.totalRevenue / stats.deals,
        unitsPerDeal: 1.5,
        totalAppointments: stats.deals * 1.3,
        appointmentsPerDeal: 1.3,
        revenuePerAppointment: stats.totalRevenue / (stats.deals * 1.3),
        closingRate: 77,
        presentationRate: 85,
        projectedAnnualEarnings: (stats.totalRevenue * 0.10 / 30) * 365,
        avgDealCycleTime: 3.2,
        thisMonthDeals: stats.deals,
        thisMonthRevenue: stats.weeklyRevenue * 4,
        daysActive: 30,
      });
    } else if (isPolaron && value === "all") {
      const totalRevenue = Object.values(POLARON_DEMO_STATS).reduce((sum, s) => sum + s.totalRevenue, 0);
      const totalDeals = Object.values(POLARON_DEMO_STATS).reduce((sum, s) => sum + s.deals, 0);
      const weeklyRevenue = Object.values(POLARON_DEMO_STATS).reduce((sum, s) => sum + s.weeklyRevenue, 0);
      
      setMetrics({
        totalDeals,
        totalRevenue,
        averageDealValue: totalRevenue / totalDeals,
        unitsPerDeal: 1.5,
        totalAppointments: totalDeals * 1.3,
        appointmentsPerDeal: 1.3,
        revenuePerAppointment: totalRevenue / (totalDeals * 1.3),
        closingRate: 77,
        presentationRate: 85,
        projectedAnnualEarnings: (totalRevenue * 0.10 / 30) * 365,
        avgDealCycleTime: 3.2,
        thisMonthDeals: totalDeals,
        thisMonthRevenue: weeklyRevenue * 4,
        daysActive: 30,
      });
    } else {
      calculateMetricsForAgent(value);
    }
  };

  const fetchAllData = async (currentAgentId, agentIds, names) => {
    try {
      const { data: allRequests, error } = await supabase
        .from("tpv_requests")
        .select("*")
        .in("agent_id", agentIds);
      
      if (error) throw error;
      
      setAllTpvRequests(allRequests || []);
      const leaderboardData = calculateLeaderboard(allRequests || [], agentIds, names);
      setLeaderboard(leaderboardData);
      
      const calculatedMetrics = calculateMetrics(allRequests || [], "all");
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const calculateMetricsForAgent = (filterAgent) => {
    const calculatedMetrics = calculateMetrics(allTpvRequests, filterAgent);
    setMetrics(calculatedMetrics);
  };

  const calculateLeaderboard = (tpvRequests, agentIds, names) => {
    const agentData = {};
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    agentIds.forEach(id => {
      agentData[id] = { weeklyRevenue: 0, totalRevenue: 0, firstDealDate: null, daysActive: 1 };
    });
    
    const completedDeals = tpvRequests.filter(r => r.status === "completed");
    
    completedDeals.forEach(deal => {
      const price = parseFloat(deal.sales_price?.replace(/[^0-9.-]+/g, "") || 0);
      const dealDate = new Date(deal.created_at);
      
      if (agentData[deal.agent_id] !== undefined) {
        agentData[deal.agent_id].totalRevenue += price;
        if (dealDate >= weekStart) {
          agentData[deal.agent_id].weeklyRevenue += price;
        }
        if (!agentData[deal.agent_id].firstDealDate || dealDate < agentData[deal.agent_id].firstDealDate) {
          agentData[deal.agent_id].firstDealDate = dealDate;
        }
      }
    });
    
    return Object.entries(agentData)
      .map(([id, data]) => {
        const daysActive = data.firstDealDate 
          ? Math.max(1, Math.ceil((now - data.firstDealDate) / (1000 * 60 * 60 * 24)))
          : 1;
        const dailySales = data.totalRevenue / daysActive;
        const projectedAnnual = dailySales * 365;
        
        return {
          id,
          name: names[id] || id,
          weeklyRevenue: data.weeklyRevenue,
          totalRevenue: data.totalRevenue,
          projectedAnnual,
          tier: getCurrentTier(data.totalRevenue),
        };
      })
      .sort((a, b) => b.weeklyRevenue - a.weeklyRevenue);
  };

  const getCurrentTier = (revenue) => {
    for (let i = PROMOTION_TIERS.length - 1; i >= 0; i--) {
      if (revenue >= PROMOTION_TIERS[i].minRevenue) {
        return PROMOTION_TIERS[i];
      }
    }
    return PROMOTION_TIERS[0];
  };

  const getNextTier = (revenue) => {
    const currentTierIndex = PROMOTION_TIERS.findIndex(t => revenue >= t.minRevenue && revenue < t.maxRevenue);
    if (currentTierIndex < PROMOTION_TIERS.length - 1) {
      return PROMOTION_TIERS[currentTierIndex + 1];
    }
    return null;
  };

  const getTierProgress = (revenue) => {
    const currentTier = getCurrentTier(revenue);
    const tierRange = currentTier.maxRevenue - currentTier.minRevenue;
    if (tierRange === Infinity) return 100;
    const progress = ((revenue - currentTier.minRevenue) / tierRange) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const calculateMetrics = (tpvRequests, filterAgent = "all") => {
    let filteredRequests = tpvRequests;
    if (filterAgent !== "all") {
      filteredRequests = tpvRequests.filter(r => r.agent_id === filterAgent);
    }
    
    const completedDeals = filteredRequests.filter(r => r.status === "completed");
    const totalDeals = completedDeals.length;
    
    const totalRevenue = completedDeals.reduce((sum, deal) => {
      const price = parseFloat(deal.sales_price?.replace(/[^0-9.-]+/g, "") || 0);
      return sum + price;
    }, 0);

    const averageDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;

    let totalUnits = 0;
    completedDeals.forEach(deal => {
      if (deal.products) {
        const productCount = deal.products.split(",").length;
        totalUnits += productCount;
      }
    });
    const unitsPerDeal = totalDeals > 0 ? totalUnits / totalDeals : 0;

    const totalAppointments = filteredRequests.length;
    const appointmentsPerDeal = totalDeals > 0 ? totalAppointments / totalDeals : 0;
    const revenuePerAppointment = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
    const closingRate = totalAppointments > 0 ? (totalDeals / totalAppointments) * 100 : 0;

    const presentations = filteredRequests.filter(r => r.status === "completed" || r.status === "initiated").length;
    const presentationRate = totalAppointments > 0 ? (presentations / totalAppointments) * 100 : 0;

    const sortedDeals = [...completedDeals].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );
    const firstDealDate = sortedDeals.length > 0 ? new Date(sortedDeals[0].created_at) : new Date();
    const daysActive = Math.max(1, Math.ceil((new Date() - firstDealDate) / (1000 * 60 * 60 * 24)));

    const dailyEarnings = (totalRevenue * 0.10) / daysActive;
    const projectedAnnualEarnings = dailyEarnings * 365;
    const avgDealCycleTime = totalDeals > 1 ? daysActive / totalDeals : 0;

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

  const formatPercent = (value) => `${value.toFixed(1)}%`;
  const formatNumber = (value, decimals = 1) => value.toFixed(decimals);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 animate-pulse flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your stats...</p>
        </div>
      </div>
    );
  }

  const currentAgentRevenue = selectedAgent === "all" 
    ? metrics?.totalRevenue || 0 
    : leaderboard.find(a => a.id === selectedAgent)?.totalRevenue || 0;
  const currentTier = getCurrentTier(currentAgentRevenue);
  const nextTier = getNextTier(currentAgentRevenue);
  const tierProgress = getTierProgress(currentAgentRevenue);
  const myRank = leaderboard.findIndex(a => a.id === agentId) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header Background */}
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent dark:from-primary/10 dark:via-purple-500/5 pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto p-4 sm:p-6">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/landing")}
            className="text-muted-foreground hover:text-foreground hover:bg-background/50 backdrop-blur"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Stats
                </h1>
              </div>
              <p className="text-muted-foreground">
                {selectedAgent === "all" 
                  ? `${tenant?.name || "Team"} Performance Overview` 
                  : `${agentNames[selectedAgent] || selectedAgent}'s Performance Dashboard`}
              </p>
            </div>
            
            {(isSuperAdmin || tenantAgents.length > 1) && (
              <Select value={selectedAgent} onValueChange={handleAgentChange}>
                <SelectTrigger className="w-[200px] bg-background/50 backdrop-blur border-border/50">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {tenantAgents.map((id) => (
                    <SelectItem key={id} value={id}>
                      {agentNames[id]} ({id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Single Scrollable Content - No Tabs */}
        <div className="space-y-4 md:space-y-5 lg:space-y-6">
          
          {/* Your Current Tier - Hero Section */}
          <Card className="border-0 shadow-xl bg-background/50 backdrop-blur overflow-hidden">
            <div className={`p-3 md:p-4 lg:p-6 bg-gradient-to-r ${currentTier.color}`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                  <div className="p-2 md:p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/20 backdrop-blur">
                    <currentTier.icon className="w-6 h-6 md:w-7 md:h-7 lg:w-10 lg:h-10" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs lg:text-sm opacity-90 font-medium">Your Current Tier</p>
                    <h2 className="text-lg md:text-xl lg:text-3xl font-black">{currentTier.name}</h2>
                    <p className="text-[10px] md:text-xs lg:text-sm opacity-90">{currentTier.bonus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] md:text-xs lg:text-sm opacity-90">Revenue</p>
                  <p className="text-base md:text-lg lg:text-3xl font-black">{formatCurrency(currentAgentRevenue)}</p>
                </div>
              </div>
            </div>
            
            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="p-3 md:p-4 lg:p-5 bg-muted/30">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <div className="flex items-center gap-1.5">
                    <ChevronUp className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <span className="text-xs md:text-sm font-semibold">Next: {nextTier.name}</span>
                  </div>
                  <span className="text-[10px] md:text-xs lg:text-sm text-muted-foreground font-medium">{formatCurrency(nextTier.minRevenue - currentAgentRevenue)} to go</span>
                </div>
                <div className="relative">
                  <Progress value={tierProgress} className="h-2.5 md:h-3 lg:h-4 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] md:text-[10px] lg:text-xs font-bold text-white drop-shadow">{formatPercent(tierProgress)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Key Performance Metrics */}
          <div>
            <h3 className="text-sm md:text-base lg:text-lg font-bold mb-2 md:mb-3 lg:mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5 lg:gap-4">
              <StatCard
                icon={DollarSign}
                iconColor="bg-emerald-500"
                title="Total Revenue"
                value={formatCurrency(metrics?.totalRevenue || 0)}
                subtitle={`${metrics?.totalDeals || 0} deals closed`}
                gradient="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
                delay={0}
              />
              <StatCard
                icon={Target}
                iconColor="bg-blue-500"
                title="Avg Deal Value"
                value={formatCurrency(metrics?.averageDealValue || 0)}
                subtitle={`${formatNumber(metrics?.unitsPerDeal || 0)} units/deal`}
                gradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
                delay={50}
              />
              <StatCard
                icon={Percent}
                iconColor="bg-purple-500"
                title="Closing Rate"
                value={formatPercent(metrics?.closingRate || 0)}
                subtitle={`${metrics?.totalAppointments || 0} appointments`}
                gradient="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
                delay={100}
              />
              <StatCard
                icon={Award}
                iconColor="bg-amber-500"
                title="Monthly Revenue"
                value={formatCurrency(metrics?.thisMonthRevenue || 0)}
                subtitle={`${metrics?.thisMonthDeals || 0} deals this month`}
                gradient="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                delay={150}
              />
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5 lg:gap-4">
            <StatCard
              icon={Calendar}
              iconColor="bg-rose-500"
              title="Days Active"
              value={metrics?.daysActive || 0}
              subtitle="Sales period"
              gradient="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30"
              delay={200}
            />
            <StatCard
              icon={Users}
              iconColor="bg-cyan-500"
              title="Rev/Appointment"
              value={formatCurrency(metrics?.revenuePerAppointment || 0)}
              subtitle="Per appointment"
              gradient="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30"
              delay={250}
            />
            <StatCard
              icon={Package}
              iconColor="bg-violet-500"
              title="Presentation Rate"
              value={formatPercent(metrics?.presentationRate || 0)}
              subtitle="Presented to customers"
              gradient="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30"
              delay={300}
            />
            <StatCard
              icon={TrendingUp}
              iconColor="bg-green-500"
              title="Projected Annual"
              value={formatCurrency(metrics?.projectedAnnualEarnings || 0)}
              subtitle="At 10% commission"
              gradient="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
              delay={350}
            />
          </div>

          {/* Weekly Leaderboard */}
          <Card className="border-0 shadow-lg md:shadow-xl bg-background/50 backdrop-blur overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-yellow-500/5 via-amber-500/5 to-orange-500/5 py-2.5 md:py-3 lg:py-4 px-3 md:px-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg lg:rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md lg:shadow-lg">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm md:text-base lg:text-xl font-bold">Weekly Leaderboard</CardTitle>
                    <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">{tenant?.name || "Team"} Rankings</p>
                  </div>
                </div>
                {myRank > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Your Rank</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-black text-primary">#{myRank}</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/50">
              {leaderboard.map((agent, index) => (
                <LeaderboardRow
                  key={agent.id}
                  agent={agent}
                  index={index}
                  isCurrentUser={agent.id === agentId}
                  formatCurrency={formatCurrency}
                />
              ))}
            </CardContent>
          </Card>

          {/* Commission Tiers - Horizontal Scroll */}
          <div>
            <h3 className="text-sm md:text-base lg:text-lg font-bold mb-2 md:mb-3 lg:mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              Commission Tiers
            </h3>
            
            <div className="overflow-x-auto pb-2 md:pb-3 lg:pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
              <div className="flex gap-2 md:grid md:grid-cols-3 lg:grid-cols-3 min-w-max md:min-w-0">
                {PROMOTION_TIERS.map((tier) => {
                  const TierIcon = tier.icon;
                  const isCurrentTier = tier.name === currentTier.name;
                  const isAchieved = currentAgentRevenue >= tier.minRevenue;
                  const isLocked = !isAchieved;
                  
                  return (
                    <Card 
                      key={tier.name}
                      className={`border-0 transition-all duration-300 flex-shrink-0 w-[200px] md:w-auto ${
                        isCurrentTier 
                          ? "ring-2 ring-primary shadow-lg shadow-primary/20" 
                          : isAchieved 
                            ? "shadow-md bg-card" 
                            : "shadow-sm bg-muted/30 opacity-60"
                      }`}
                    >
                      <CardContent className="p-2.5 md:p-3 lg:p-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`p-1.5 md:p-2 lg:p-2.5 rounded-lg lg:rounded-xl bg-gradient-to-br ${tier.color} shadow-md lg:shadow-lg flex-shrink-0 ${isLocked ? 'grayscale' : ''}`}>
                            <TierIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 md:gap-2">
                              <h4 className="font-bold text-xs md:text-sm">{tier.name}</h4>
                              {isCurrentTier && (
                                <span className="text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full font-semibold">YOU</span>
                              )}
                            </div>
                            <p className="text-[9px] md:text-[10px] lg:text-[11px] text-muted-foreground">{tier.bonus}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] md:text-xs font-semibold">
                              {tier.maxRevenue === Infinity ? `${formatCurrency(tier.minRevenue)}+` : formatCurrency(tier.minRevenue)}
                            </p>
                            {isLocked && (
                              <p className="text-[8px] md:text-[10px] text-muted-foreground">{formatCurrency(tier.minRevenue - currentAgentRevenue)} to go</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
