import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, Target, Users, Calendar, Package, Percent, Award, Trophy, Crown, Medal, Star, Flame, Zap, Sparkles, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { TenantSwitcherInline } from "@/components/TenantSwitcher";

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
    className={`relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 ${gradient}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <CardContent className="p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={`p-1 rounded ${iconColor}`}>
          <Icon className="w-3 h-3 text-white" />
        </div>
      </div>
      <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
);

const LeaderboardRow = ({ agent, index, isCurrentUser, formatCurrency }) => {
  const TierIcon = agent.tier.icon;
  const rankStyles = {
    0: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-yellow-400/40 shadow-md",
    1: "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-slate-400/20 shadow-sm",
    2: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-amber-600/20 shadow-sm",
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 sm:p-4 transition-all ${
        isCurrentUser 
          ? "bg-primary/5 border-l-3 border-primary" 
          : "hover:bg-muted/30"
      }`}
    >
      {/* Rank Badge */}
      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
        rankStyles[index] || "bg-muted text-muted-foreground"
      }`}>
        {index === 0 ? (
          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow" />
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
        <div className="flex items-center gap-1.5">
          <p className={`font-semibold text-sm truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
            {agent.name}
          </p>
          {isCurrentUser && (
            <span className="text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full font-medium">YOU</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-4 h-4 rounded bg-gradient-to-br ${agent.tier.color} flex items-center justify-center`}>
            <TierIcon className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[10px] text-muted-foreground">{agent.tier.name}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="font-bold text-foreground text-sm">{formatCurrency(agent.weeklyRevenue)}</p>
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">This Week</p>
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
  
  // Scroll state for tier carousel
  const tierScrollRef = React.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkTierScroll = React.useCallback(() => {
    if (tierScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tierScrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkTierScroll();
    window.addEventListener('resize', checkTierScroll);
    return () => window.removeEventListener('resize', checkTierScroll);
  }, [checkTierScroll]);

  const scrollTiers = (direction) => {
    if (tierScrollRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      tierScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
          thisWeekDeals: Math.round(totalDeals / 4),
          thisWeekRevenue: weeklyRevenue,
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
        thisWeekDeals: Math.round(stats.deals / 4),
        thisWeekRevenue: stats.weeklyRevenue,
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
        thisWeekDeals: Math.round(totalDeals / 4),
        thisWeekRevenue: weeklyRevenue,
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
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekDeals = completedDeals.filter(d => new Date(d.created_at) >= weekStart);
    const thisWeekRevenue = thisWeekDeals.reduce((sum, deal) => {
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
      thisWeekDeals: thisWeekDeals.length,
      thisWeekRevenue,
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
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-primary/15 via-purple-500/5 to-transparent dark:from-primary/10 dark:via-purple-500/5 pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {/* Navigation Header */}
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/landing")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Agent Selector */}
            {(isSuperAdmin || tenantAgents.length > 1) && (
              <Select value={selectedAgent} onValueChange={handleAgentChange}>
                <SelectTrigger className="w-[140px] sm:w-[180px] bg-background/80 backdrop-blur border-border/50 text-sm">
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
        </header>

        {/* Compact Title - only show agent name when specific agent selected */}
        {selectedAgent !== "all" && (
          <div className="mb-4 sm:mb-5">
            <p className="text-sm text-muted-foreground">
              {agentNames[selectedAgent] || selectedAgent}'s Performance
            </p>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4 sm:space-y-5">
          
          {/* Your Current Tier - Compact */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className={`p-3 bg-gradient-to-r ${currentTier.color}`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur">
                    <currentTier.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold">{currentTier.name}</h2>
                      <span className="text-[10px] opacity-80 bg-white/10 px-1.5 py-0.5 rounded">{currentTier.bonus}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold">{formatCurrency(currentAgentRevenue)}</p>
                </div>
              </div>
            </div>
            
            {nextTier && (
              <div className="p-2 bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Next: {nextTier.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatCurrency(nextTier.minRevenue - currentAgentRevenue)} to go</span>
                </div>
                <Progress value={tierProgress} className="h-1.5 rounded-full" />
              </div>
            )}
          </Card>

          {/* Commission Tiers - Compact Horizontal Scroll */}
          <div className="relative flex items-center gap-1">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button 
                onClick={() => scrollTiers('left')}
                className="flex-shrink-0 p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            
            {/* Scrollable Tiers */}
            <div 
              ref={tierScrollRef}
              onScroll={checkTierScroll}
              className="flex-1 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex gap-2 min-w-max py-1 px-0.5">
                {PROMOTION_TIERS.map((tier) => {
                  const TierIcon = tier.icon;
                  const isCurrentTier = tier.name === currentTier.name;
                  
                  return (
                    <div 
                      key={tier.name}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all ${
                        isCurrentTier 
                          ? "bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm" 
                          : "opacity-40 grayscale"
                      }`}
                    >
                      <div className={`p-1.5 rounded-md bg-gradient-to-br ${tier.color} ${!isCurrentTier ? 'opacity-60' : 'shadow-md'}`}>
                        <TierIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className={`text-xs font-semibold ${isCurrentTier ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {tier.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button 
                onClick={() => scrollTiers('right')}
                className="flex-shrink-0 p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Gamification Alert - Rank Up Challenge */}
          {(() => {
            const myIndex = leaderboard.findIndex(a => a.id === agentId);
            if (myIndex > 0 && myIndex < leaderboard.length) {
              const aheadAgent = leaderboard[myIndex - 1];
              const myAgent = leaderboard[myIndex];
              const gap = aheadAgent.weeklyRevenue - myAgent.weeklyRevenue;
              return (
                <Card className="border-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                        <ChevronUp className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Rank Up Challenge</p>
                        <p className="text-xs text-muted-foreground">
                          Sell <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(gap + 1)}</span> more this week to pass <span className="font-medium">{aheadAgent.name}</span> for #{myIndex}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="text-sm font-bold text-primary">#{myIndex + 1}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            if (myIndex === 0) {
              const currentAgent = leaderboard[0];
              const secondAgent = leaderboard[1];
              const lead = currentAgent?.weeklyRevenue - (secondAgent?.weeklyRevenue || 0);
              return (
                <Card className="border-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">You're #1!</p>
                        <p className="text-xs text-muted-foreground">
                          {secondAgent ? `Leading by ${formatCurrency(lead)} over ${secondAgent.name}` : "Keep up the great work!"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Upcoming Payout Cheque */}
          {(() => {
            // Calculate next Friday
            const today = new Date();
            const dayOfWeek = today.getDay();
            const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
            const nextFriday = new Date(today);
            nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
            const fridayDate = nextFriday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const chequeAmount = (metrics?.thisWeekRevenue || 0) * 0.10;
            
            return (
              <div className="relative bg-gradient-to-b from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-950/50 dark:via-yellow-950/40 dark:to-amber-900/50 rounded-lg overflow-hidden shadow-xl border border-amber-200 dark:border-amber-700">
                {/* Top decorative border */}
                <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
                
                {/* Guilloche pattern background */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
                
                <div className="relative p-4 sm:p-5">
                  {/* Bank header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-200 tracking-wide">COMMISSION PAYOUT</p>
                      <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Weekly Sales Earnings</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pay Date</p>
                      <p className="text-xs font-bold font-mono text-amber-800 dark:text-amber-200">{fridayDate}</p>
                    </div>
                  </div>
                  
                  {/* Pay to line */}
                  <div className="mb-3">
                    <p className="text-[8px] uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Pay to the order of</p>
                    <div className="flex items-center gap-3">
                      <p className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-100 flex-1 border-b-2 border-amber-300 dark:border-amber-600 pb-1 font-serif italic">
                        {agentNames[agentId] || 'Agent'}
                      </p>
                      {/* Amount box */}
                      <div className="border-2 border-amber-400 dark:border-amber-500 bg-white/60 dark:bg-amber-950/60 px-3 py-1.5 rounded">
                        <p className="text-lg sm:text-xl font-black text-amber-800 dark:text-amber-200 font-mono">
                          {formatCurrency(chequeAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Written amount */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300 font-serif italic flex-1 border-b border-amber-200 dark:border-amber-700 pb-1">
                        {chequeAmount >= 1000 
                          ? `${Math.floor(chequeAmount / 1000)} thousand ${Math.round(chequeAmount % 1000)} dollars`
                          : `${Math.round(chequeAmount)} dollars`
                        } and 00/100
                      </p>
                      <p className="text-[9px] text-amber-500 dark:text-amber-500 uppercase tracking-wide">Dollars</p>
                    </div>
                  </div>
                  
                  {/* Memo and signature */}
                  <div className="flex items-end justify-between pt-2">
                    <div className="flex-1">
                      <p className="text-[8px] uppercase tracking-wider text-amber-500 dark:text-amber-500 mb-0.5">Memo</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 border-b border-amber-200 dark:border-amber-700 pb-1 inline-block pr-8">
                        10% of {formatCurrency(metrics?.thisWeekRevenue || 0)} production
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="border-b-2 border-amber-400 dark:border-amber-500 w-24 mb-0.5" />
                      <p className="text-[7px] uppercase tracking-wider text-amber-500 dark:text-amber-500">Authorized Signature</p>
                    </div>
                  </div>
                </div>
                
                {/* Bottom decorative border */}
                <div className="h-1.5 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300" />
              </div>
            );
          })()}

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Calendar}
              iconColor="bg-amber-500"
              title="This Week"
              value={formatCurrency(metrics?.thisWeekRevenue || 0)}
              subtitle={`${metrics?.thisWeekDeals || 0} deals`}
              gradient="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
            />
            <StatCard
              icon={TrendingUp}
              iconColor="bg-blue-500"
              title="This Month"
              value={formatCurrency((metrics?.thisWeekRevenue || 0) * 4.33)}
              subtitle={`~${Math.round((metrics?.thisWeekDeals || 0) * 4.33)} deals pace`}
              gradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
            />
            <StatCard
              icon={DollarSign}
              iconColor="bg-emerald-500"
              title="All Time"
              value={formatCurrency(metrics?.totalRevenue || 0)}
              subtitle={`${metrics?.totalDeals || 0} deals closed`}
              gradient="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
            />
            <StatCard
              icon={Award}
              iconColor="bg-purple-500"
              title="Yearly Pace"
              value={formatCurrency(metrics?.projectedAnnualEarnings || 0)}
              subtitle={`Est. commission`}
              gradient="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
            />
          </div>

          {/* Weekly Leaderboard */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-yellow-500/10 to-amber-500/10 py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Weekly Leaderboard</CardTitle>
                {myRank > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Your Rank</p>
                    <p className="text-lg font-bold text-primary">#{myRank}</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/30">
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
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
