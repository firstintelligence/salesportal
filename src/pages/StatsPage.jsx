import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, Target, Users, Calendar, Package, Percent, Award, Trophy, Crown, Medal, Star, Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Promotion tiers with targets
const PROMOTION_TIERS = [
  { name: "Rookie", minRevenue: 0, maxRevenue: 25000, color: "from-slate-400 to-slate-500", icon: Star, bonus: "Base Commission" },
  { name: "Rising Star", minRevenue: 25000, maxRevenue: 50000, color: "from-blue-400 to-blue-600", icon: Zap, bonus: "+1% Commission" },
  { name: "Pro Closer", minRevenue: 50000, maxRevenue: 100000, color: "from-purple-400 to-purple-600", icon: Flame, bonus: "+2% Commission" },
  { name: "Elite", minRevenue: 100000, maxRevenue: 200000, color: "from-amber-400 to-orange-500", icon: Medal, bonus: "+3% + $500 Bonus" },
  { name: "Champion", minRevenue: 200000, maxRevenue: 500000, color: "from-yellow-400 to-amber-500", icon: Trophy, bonus: "+4% + $1000 Bonus" },
  { name: "Legend", minRevenue: 500000, maxRevenue: Infinity, color: "from-yellow-300 to-yellow-500", icon: Crown, bonus: "+5% + $2500 Bonus" },
];

const StatsPage = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [leaderboard, setLeaderboard] = useState([]);
  const [allTpvRequests, setAllTpvRequests] = useState([]);

  useEffect(() => {
    const storedAgentId = localStorage.getItem("agentId");
    if (!storedAgentId) {
      navigate("/");
      return;
    }
    setAgentId(storedAgentId);
    const isAdmin = storedAgentId === "MM23";
    setSelectedAgent(isAdmin ? "all" : storedAgentId);
    fetchAllData(storedAgentId);
  }, [navigate]);

  const handleAgentChange = (value) => {
    setSelectedAgent(value);
    calculateMetricsForAgent(value);
  };

  const fetchAllData = async (currentAgentId) => {
    try {
      setLoading(true);
      
      // Always fetch all TPV requests for leaderboard
      const { data: allRequests, error } = await supabase
        .from("tpv_requests")
        .select("*");
      
      if (error) throw error;
      
      setAllTpvRequests(allRequests || []);
      
      // Calculate leaderboard
      const leaderboardData = calculateLeaderboard(allRequests || []);
      setLeaderboard(leaderboardData);
      
      // Calculate metrics for current view
      const isAdmin = currentAgentId === "MM23";
      const filterAgent = isAdmin ? "all" : currentAgentId;
      const calculatedMetrics = calculateMetrics(allRequests || [], filterAgent);
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetricsForAgent = (filterAgent) => {
    const calculatedMetrics = calculateMetrics(allTpvRequests, filterAgent);
    setMetrics(calculatedMetrics);
  };

  const calculateLeaderboard = (tpvRequests) => {
    const agentRevenues = {};
    
    AGENT_IDS.forEach(id => {
      agentRevenues[id] = 0;
    });
    
    tpvRequests
      .filter(r => r.status === "completed")
      .forEach(deal => {
        const price = parseFloat(deal.sales_price?.replace(/[^0-9.-]+/g, "") || 0);
        if (agentRevenues[deal.agent_id] !== undefined) {
          agentRevenues[deal.agent_id] += price;
        }
      });
    
    return Object.entries(agentRevenues)
      .map(([id, revenue]) => ({
        id,
        name: AGENT_NAMES[id],
        revenue,
        tier: getCurrentTier(revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 flex items-center justify-center">
        <div className="text-muted-foreground">Loading stats...</div>
      </div>
    );
  }

  const currentAgentRevenue = selectedAgent === "all" 
    ? metrics?.totalRevenue || 0 
    : leaderboard.find(a => a.id === selectedAgent)?.revenue || 0;
  const currentTier = getCurrentTier(currentAgentRevenue);
  const nextTier = getNextTier(currentAgentRevenue);
  const tierProgress = getTierProgress(currentAgentRevenue);
  const myRank = leaderboard.findIndex(a => a.id === agentId) + 1;

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
                Agent Stats
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="tiers">Rank & Tiers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-xs text-muted-foreground mt-1">From {metrics?.totalAppointments || 0} appointments</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Average visits to close</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Appointments with presentations</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Average equipment pieces</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Time between deals</p>
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
                  <p className="text-xs text-muted-foreground mt-1">{metrics?.thisMonthDeals || 0} deals this month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Revenue Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {leaderboard.map((agent, index) => {
                    const isCurrentUser = agent.id === agentId;
                    const TierIcon = agent.tier.icon;
                    return (
                      <div 
                        key={agent.id}
                        className={`flex items-center gap-4 p-4 transition-colors ${
                          isCurrentUser ? "bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        {/* Rank */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                          index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                          index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index === 0 ? <Crown className="w-5 h-5" /> : index + 1}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                              {agent.name}
                              {isCurrentUser && <span className="text-xs ml-2 text-muted-foreground">(You)</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <TierIcon className={`w-3 h-3 bg-gradient-to-r ${agent.tier.color} rounded`} />
                            <span className="text-xs text-muted-foreground">{agent.tier.name}</span>
                          </div>
                        </div>

                        {/* Revenue */}
                        <div className="text-right">
                          <p className="font-bold text-foreground">{formatCurrency(agent.revenue)}</p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Your Position */}
            {myRank > 0 && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">#{myRank}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Your Current Rank</p>
                        <p className="text-sm text-muted-foreground">
                          {myRank === 1 ? "You're the top performer!" : 
                           myRank <= 3 ? "Great job! You're in the top 3!" : 
                           "Keep pushing to climb the ranks!"}
                        </p>
                      </div>
                    </div>
                    {myRank > 1 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">To reach #{myRank - 1}</p>
                        <p className="font-semibold text-foreground">
                          +{formatCurrency(leaderboard[myRank - 2]?.revenue - leaderboard[myRank - 1]?.revenue || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers" className="space-y-6">
            {/* Current Tier Status */}
            <Card className={`overflow-hidden bg-gradient-to-br ${currentTier.color} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <currentTier.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-white">
                    <p className="text-sm opacity-80">Current Rank</p>
                    <h2 className="text-2xl font-bold">{currentTier.name}</h2>
                    <p className="text-sm opacity-80">{currentTier.bonus}</p>
                  </div>
                </div>

                {nextTier && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-white text-sm">
                      <span>Progress to {nextTier.name}</span>
                      <span>{formatCurrency(currentAgentRevenue)} / {formatCurrency(nextTier.minRevenue)}</span>
                    </div>
                    <Progress value={tierProgress} className="h-3 bg-white/20" />
                    <p className="text-white/80 text-sm">
                      {formatCurrency(nextTier.minRevenue - currentAgentRevenue)} more to unlock {nextTier.name}
                    </p>
                  </div>
                )}

                {!nextTier && (
                  <div className="flex items-center gap-2 text-white">
                    <Crown className="w-5 h-5" />
                    <span className="font-semibold">You've reached the highest tier!</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Tiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="w-5 h-5" />
                  Promotion Tiers & Bonuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PROMOTION_TIERS.map((tier, index) => {
                    const TierIcon = tier.icon;
                    const isCurrentTier = tier.name === currentTier.name;
                    const isAchieved = currentAgentRevenue >= tier.minRevenue;
                    
                    return (
                      <div 
                        key={tier.name}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                          isCurrentTier 
                            ? `bg-gradient-to-r ${tier.color} text-white` 
                            : isAchieved 
                              ? "bg-muted/50 border border-primary/20" 
                              : "bg-muted/30 opacity-60"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCurrentTier ? "bg-white/20" : `bg-gradient-to-br ${tier.color}`
                        }`}>
                          <TierIcon className={`w-5 h-5 ${isCurrentTier ? "text-white" : "text-white"}`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${isCurrentTier ? "text-white" : "text-foreground"}`}>
                              {tier.name}
                            </p>
                            {isCurrentTier && (
                              <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">Current</span>
                            )}
                            {isAchieved && !isCurrentTier && (
                              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 rounded-full">✓ Achieved</span>
                            )}
                          </div>
                          <p className={`text-sm ${isCurrentTier ? "text-white/80" : "text-muted-foreground"}`}>
                            {tier.maxRevenue === Infinity 
                              ? `${formatCurrency(tier.minRevenue)}+` 
                              : `${formatCurrency(tier.minRevenue)} - ${formatCurrency(tier.maxRevenue)}`}
                          </p>
                        </div>

                        <div className={`text-right ${isCurrentTier ? "text-white" : "text-foreground"}`}>
                          <p className="font-semibold text-sm">{tier.bonus}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Motivation Card */}
            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Keep Pushing!</h3>
                    <p className="text-sm text-muted-foreground">
                      {nextTier 
                        ? `You're ${formatPercent(tierProgress)} of the way to ${nextTier.name}! Close ${Math.ceil((nextTier.minRevenue - currentAgentRevenue) / (metrics?.averageDealValue || 15000))} more deals at your average deal value to level up.`
                        : "You've mastered the game! Keep setting records and inspiring others."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StatsPage;
