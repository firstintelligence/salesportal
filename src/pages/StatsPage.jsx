import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, Target, Users, Calendar, Package, Percent, Award, Trophy, Crown, Medal, Star, Flame, Zap, Sparkles, ChevronUp } from "lucide-react";
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
    className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${gradient}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
      <Icon className="w-full h-full" />
    </div>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-foreground/70 flex items-center gap-2">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

const LeaderboardRow = ({ agent, index, isCurrentUser, formatCurrency }) => {
  const TierIcon = agent.tier.icon;
  const rankStyles = {
    0: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-yellow-400/50 shadow-lg",
    1: "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-slate-400/30 shadow-md",
    2: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-amber-600/30 shadow-md",
  };

  return (
    <div 
      className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 transition-all duration-300 ${
        isCurrentUser 
          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary" 
          : "hover:bg-muted/50"
      } ${index === 0 ? "bg-gradient-to-r from-yellow-500/5 to-transparent" : ""}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Rank Badge */}
      <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform hover:scale-110 ${
        rankStyles[index] || "bg-muted text-muted-foreground"
      }`}>
        {index === 0 ? (
          <Crown className="w-6 h-6 text-white drop-shadow" />
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
        <div className="flex items-center gap-2">
          <p className={`font-bold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
            {agent.name}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">YOU</span>
          )}
          {index === 0 && (
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${agent.tier.color} flex items-center justify-center`}>
            <TierIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{agent.tier.name}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="font-bold text-foreground text-lg">{formatCurrency(agent.weeklyRevenue)}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">This Week</p>
      </div>
      <div className="text-right min-w-[90px] sm:min-w-[110px] hidden sm:block">
        <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(agent.projectedAnnual)}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Annual</p>
      </div>
    </div>
  );
};

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
    // Only admin MM23 can access stats page
    if (storedAgentId !== "MM23") {
      navigate("/landing");
      return;
    }
    setAgentId(storedAgentId);
    setSelectedAgent("all");
    fetchAllData(storedAgentId);
  }, [navigate]);

  const handleAgentChange = (value) => {
    setSelectedAgent(value);
    calculateMetricsForAgent(value);
  };

  const fetchAllData = async (currentAgentId) => {
    try {
      setLoading(true);
      const { data: allRequests, error } = await supabase
        .from("tpv_requests")
        .select("*");
      
      if (error) throw error;
      
      setAllTpvRequests(allRequests || []);
      const leaderboardData = calculateLeaderboard(allRequests || []);
      setLeaderboard(leaderboardData);
      
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
    const agentData = {};
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    AGENT_IDS.forEach(id => {
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
          name: AGENT_NAMES[id],
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
                  ? "All Agents Performance Overview" 
                  : `${AGENT_NAMES[selectedAgent] || selectedAgent}'s Performance Dashboard`}
              </p>
            </div>
            
            {agentId === "MM23" && (
              <Select value={selectedAgent} onValueChange={handleAgentChange}>
                <SelectTrigger className="w-[200px] bg-background/50 backdrop-blur border-border/50">
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
          <TabsList className="grid w-full grid-cols-3 max-w-lg bg-background/50 backdrop-blur p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="tiers" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow">
              <Medal className="w-4 h-4 mr-2" />
              Tiers
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                icon={TrendingUp}
                iconColor="bg-blue-500"
                title="Avg Deal Value"
                value={formatCurrency(metrics?.averageDealValue || 0)}
                subtitle="per closed deal"
                gradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
                delay={50}
              />
              <StatCard
                icon={Target}
                iconColor="bg-purple-500"
                title="Closing Rate"
                value={formatPercent(metrics?.closingRate || 0)}
                subtitle="of appointments"
                gradient="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30"
                delay={100}
              />
              <StatCard
                icon={Award}
                iconColor="bg-amber-500"
                title="Projected Annual"
                value={formatCurrency(metrics?.projectedAnnualEarnings || 0)}
                subtitle="at 10% commission"
                gradient="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                delay={150}
              />
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-border/50 bg-background/50 backdrop-blur hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Revenue per Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics?.revenuePerAppointment || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">From {metrics?.totalAppointments || 0} appointments</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 backdrop-blur hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Appointments per Deal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(metrics?.appointmentsPerDeal || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Average visits to close</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 backdrop-blur hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Presentation Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{formatPercent(metrics?.presentationRate || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Appointments with presentations</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 backdrop-blur hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Units per Deal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(metrics?.unitsPerDeal || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Average equipment pieces</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 backdrop-blur hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Avg Deal Cycle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(metrics?.avgDealCycleTime || 0, 0)} days</p>
                  <p className="text-xs text-muted-foreground mt-1">Time between deals</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics?.thisMonthRevenue || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics?.thisMonthDeals || 0} deals this month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6 animate-fade-in">
            <Card className="overflow-hidden border-0 shadow-xl bg-background/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/10 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Weekly Leaderboard</CardTitle>
                      <p className="text-sm text-muted-foreground">Top performers this week</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-background/80 rounded-full text-xs font-medium text-muted-foreground">
                    Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {leaderboard.map((agent, index) => (
                    <LeaderboardRow
                      key={agent.id}
                      agent={agent}
                      index={index}
                      isCurrentUser={agent.id === agentId}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Your Position Card */}
            {myRank > 0 && (
              <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-purple-500/10 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                        <span className="text-2xl font-black text-white">#{myRank}</span>
                      </div>
                      <div>
                        <p className="font-bold text-lg text-foreground">Your Weekly Rank</p>
                        <p className="text-sm text-muted-foreground">
                          {myRank === 1 ? "🔥 You're the top performer!" : 
                           myRank <= 3 ? "🏆 Great job! Top 3 this week!" : 
                           "💪 Keep pushing to climb!"}
                        </p>
                      </div>
                    </div>
                    {myRank > 1 && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ChevronUp className="w-4 h-4" />
                          To reach #{myRank - 1}
                        </div>
                        <p className="font-bold text-lg text-foreground">
                          +{formatCurrency(leaderboard[myRank - 2]?.weeklyRevenue - leaderboard[myRank - 1]?.weeklyRevenue || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers" className="space-y-6 animate-fade-in">
            {/* Current Tier Hero */}
            <Card className={`overflow-hidden border-0 shadow-2xl bg-gradient-to-br ${currentTier.color}`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
              <CardContent className="relative p-6 sm:p-8">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-xl">
                    <currentTier.icon className="w-10 h-10 text-white drop-shadow" />
                  </div>
                  <div className="text-white">
                    <p className="text-sm opacity-80 uppercase tracking-wider font-medium">Current Rank</p>
                    <h2 className="text-3xl sm:text-4xl font-black">{currentTier.name}</h2>
                    <p className="text-sm opacity-90 mt-1 font-medium">{currentTier.bonus}</p>
                  </div>
                </div>

                {nextTier && (
                  <div className="space-y-3 bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="flex justify-between text-white text-sm font-medium">
                      <span>Progress to {nextTier.name}</span>
                      <span>{formatCurrency(currentAgentRevenue)} / {formatCurrency(nextTier.minRevenue)}</span>
                    </div>
                    <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${tierProgress}%` }}
                      />
                    </div>
                    <p className="text-white/80 text-sm">
                      <span className="font-bold text-white">{formatCurrency(nextTier.minRevenue - currentAgentRevenue)}</span> more to unlock {nextTier.name}
                    </p>
                  </div>
                )}

                {!nextTier && (
                  <div className="flex items-center gap-3 text-white bg-white/10 backdrop-blur rounded-xl p-4">
                    <Crown className="w-6 h-6" />
                    <span className="font-bold text-lg">You've reached the highest tier!</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Tiers */}
            <Card className="border-border/50 bg-background/80 backdrop-blur shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                    <Medal className="w-5 h-5 text-white" />
                  </div>
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
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                          isCurrentTier 
                            ? `bg-gradient-to-r ${tier.color} text-white shadow-lg scale-[1.02]` 
                            : isAchieved 
                              ? "bg-muted/50 border border-primary/20" 
                              : "bg-muted/20 opacity-50"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110 ${
                          isCurrentTier ? "bg-white/20 shadow-lg" : `bg-gradient-to-br ${tier.color}`
                        }`}>
                          <TierIcon className="w-6 h-6 text-white drop-shadow" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${isCurrentTier ? "text-white" : "text-foreground"}`}>
                              {tier.name}
                            </p>
                            {isCurrentTier && (
                              <span className="text-xs px-2.5 py-1 bg-white/20 rounded-full font-medium">Current</span>
                            )}
                            {isAchieved && !isCurrentTier && (
                              <span className="text-xs px-2.5 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">✓ Achieved</span>
                            )}
                          </div>
                          <p className={`text-sm ${isCurrentTier ? "text-white/80" : "text-muted-foreground"}`}>
                            {tier.maxRevenue === Infinity 
                              ? `${formatCurrency(tier.minRevenue)}+` 
                              : `${formatCurrency(tier.minRevenue)} - ${formatCurrency(tier.maxRevenue)}`}
                          </p>
                        </div>

                        <div className={`text-right ${isCurrentTier ? "text-white" : "text-foreground"}`}>
                          <p className="font-bold">{tier.bonus}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Motivation Card */}
            <Card className="border-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Flame className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">Keep Pushing!</h3>
                    <p className="text-muted-foreground">
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
