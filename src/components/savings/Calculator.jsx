import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Home, DollarSign, Zap, Wind, Sun, Battery, Droplet, TrendingDown, Leaf, ThermometerSun, Flame, Snowflake, ArrowRight, ArrowDown, Play, X, ChevronDown, Calculator as CalcIcon } from "lucide-react";

// Custom Heat/Cool icon - flame top-left (on top), snowflake bottom-right (behind)
const HeatCoolIcon = ({ className }) => (
  <div className={`relative ${className}`} style={{ width: '1.25em', height: '1.25em' }}>
    <div 
      className="absolute bottom-0 right-0 w-[75%] h-[75%] z-0"
      style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)' }}
    >
      <Snowflake className="w-full h-full text-current rotate-45" />
    </div>
    <Flame className="absolute top-0 left-0 w-[75%] h-[75%] text-current z-10" style={{ filter: 'drop-shadow(0 0 1px currentColor)' }} />
  </div>
);

const CATEGORIES = [
  { id: "hvac", name: "Heating & Cooling", icon: HeatCoolIcon, color: "from-red-500 to-rose-500", bgColor: "bg-red-500", borderColor: "border-red-500" },
  { id: "insulation", name: "Insulation", icon: Home, color: "from-[#FF69B4] to-[#FF1493]", bgColor: "bg-[#FF69B4]", borderColor: "border-[#FF69B4]" },
  { id: "hotwater", name: "Hot Water", icon: Droplet, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500", borderColor: "border-blue-500" },
  { id: "solar", name: "Solar Panels", icon: Sun, color: "from-yellow-300 to-yellow-500", bgColor: "bg-yellow-400", borderColor: "border-yellow-400" },
  { id: "battery", name: "Home Battery", icon: Battery, color: "from-green-500 to-emerald-500", bgColor: "bg-green-500", borderColor: "border-green-500" },
];

// TOU (Time-of-Use) rates in $/kWh - Summer rates
const TOU_RATES = {
  onPeak: 0.158,    // On-peak rate
  midPeak: 0.122,   // Mid-peak rate
  offPeak: 0.087,   // Off-peak rate
};

// ULO (Ultra-Low Overnight) rates in $/kWh
const ULO_RATES = {
  onPeak: 0.28,     // Ultra-high peak rate
  midPeak: 0.122,   // Mid-peak rate
  offPeak: 0.028,   // Ultra-low overnight rate
};

// Calculate monthly payment with 2.99% interest over 240 months
const calculateMonthlyPayment = (principal) => {
  const annualRate = 0.0299;
  const monthlyRate = annualRate / 12;
  const numPayments = 240;
  
  if (principal <= 0) return 0;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(payment * 100) / 100;
};

// Battery Calculator Component - inspired by the reference screenshot
const BatteryCalculator = ({ onSavingsCalculated }) => {
  const [months, setMonths] = useState([
    { onPeak: '', midPeak: '', offPeak: '' },
    { onPeak: '', midPeak: '', offPeak: '' },
    { onPeak: '', midPeak: '', offPeak: '' },
  ]);
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState(null);

  const handleInputChange = (monthIndex, field, value) => {
    const newMonths = [...months];
    newMonths[monthIndex][field] = value;
    setMonths(newMonths);
  };

  const hasAnyInput = () => {
    return months.some(m => 
      (m.onPeak !== '' && parseFloat(m.onPeak) > 0) || 
      (m.midPeak !== '' && parseFloat(m.midPeak) > 0) || 
      (m.offPeak !== '' && parseFloat(m.offPeak) > 0)
    );
  };

  const calculateSavings = () => {
    const monthlyResults = months.map((month) => {
      const onPeak = parseFloat(month.onPeak) || 0;
      const midPeak = parseFloat(month.midPeak) || 0;
      const offPeak = parseFloat(month.offPeak) || 0;
      
      const touCost = (onPeak * TOU_RATES.onPeak) + 
                      (midPeak * TOU_RATES.midPeak) + 
                      (offPeak * TOU_RATES.offPeak);
      
      // With battery: shift on-peak usage to off-peak (ULO overnight charging)
      const uloCost = (onPeak * ULO_RATES.offPeak) + // On-peak shifted to off-peak
                      (midPeak * ULO_RATES.midPeak) + 
                      (offPeak * ULO_RATES.offPeak);
      
      const savings = touCost - uloCost;
      const totalUsage = onPeak + midPeak + offPeak;
      
      return { touCost, uloCost, savings, totalUsage, onPeak };
    });

    const validMonths = monthlyResults.filter(m => m.totalUsage > 0);
    
    if (validMonths.length === 0) {
      setResults(null);
      setCalculated(false);
      return;
    }

    const totalUsage = validMonths.reduce((sum, m) => sum + m.totalUsage, 0);
    const totalTouCost = validMonths.reduce((sum, m) => sum + m.touCost, 0);
    const totalUloCost = validMonths.reduce((sum, m) => sum + m.uloCost, 0);
    const avgMonthlySavings = (totalTouCost - totalUloCost) / validMonths.length;
    
    // Calculate daily peak usage for battery sizing
    const avgDailyPeakUsage = (validMonths.reduce((sum, m) => sum + m.onPeak, 0) / validMonths.length) / 30;
    
    // Recommend battery size (round up to nearest 5 kWh)
    const recommendedBattery = Math.ceil(avgDailyPeakUsage / 5) * 5 || 10;

    const calculatedResults = {
      totalUsage: totalUsage / validMonths.length,
      touCost: totalTouCost / validMonths.length,
      uloCost: totalUloCost / validMonths.length,
      avgMonthlySavings,
      peakHrsDailyAvg: avgDailyPeakUsage,
      recommendedBattery,
      monthlyResults,
    };

    setResults(calculatedResults);
    setCalculated(true);
    
    if (onSavingsCalculated) {
      onSavingsCalculated(Math.round(avgMonthlySavings));
    }
  };

  const resetCalculator = () => {
    setMonths([
      { onPeak: '', midPeak: '', offPeak: '' },
      { onPeak: '', midPeak: '', offPeak: '' },
      { onPeak: '', midPeak: '', offPeak: '' },
    ]);
    setCalculated(false);
    setResults(null);
    if (onSavingsCalculated) {
      onSavingsCalculated(0);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Electricity Savings Calculator</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Note: delivery charges are not calculated here.</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Enter your electricity usage (at least 1 month, up to 3 months):</p>
      </div>

      {/* Month Input Cards - Condensed Layout */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 max-w-xl mx-auto">
        {months.map((month, index) => (
          <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-2 md:p-3 space-y-1.5 md:space-y-2">
            <h4 className="font-semibold text-green-700 dark:text-green-400 text-xs md:text-sm text-center">Month {index + 1}</h4>
            
            {/* Stacked inputs - compact on mobile */}
            <div className="space-y-1.5">
              <div>
                <Label className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">On-Peak</Label>
                <Input
                  type="number"
                  value={month.onPeak}
                  onChange={(e) => handleInputChange(index, 'onPeak', e.target.value)}
                  placeholder="kWh"
                  className="h-7 md:h-8 bg-white dark:bg-slate-900 text-xs md:text-sm placeholder:text-[10px] placeholder:text-slate-300 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">Mid-Peak</Label>
                <Input
                  type="number"
                  value={month.midPeak}
                  onChange={(e) => handleInputChange(index, 'midPeak', e.target.value)}
                  placeholder="kWh"
                  className="h-7 md:h-8 bg-white dark:bg-slate-900 text-xs md:text-sm placeholder:text-[10px] placeholder:text-slate-300 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">Off-Peak</Label>
                <Input
                  type="number"
                  value={month.offPeak}
                  onChange={(e) => handleInputChange(index, 'offPeak', e.target.value)}
                  placeholder="kWh"
                  className="h-7 md:h-8 bg-white dark:bg-slate-900 text-xs md:text-sm placeholder:text-[10px] placeholder:text-slate-300 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {calculated && results?.monthlyResults[index] && results.monthlyResults[index].totalUsage > 0 && (
              <div className="pt-1.5 md:pt-2 border-t border-slate-200 dark:border-slate-600">
                <p className="text-[10px] md:text-xs font-medium text-green-600 dark:text-green-400 text-center">
                  Saves: ${results.monthlyResults[index].savings.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <Button 
          onClick={calculateSavings}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6"
          disabled={!hasAnyInput()}
        >
          <CalcIcon className="w-4 h-4 mr-2" />
          Calculate
        </Button>
        <Button 
          variant="outline" 
          onClick={resetCalculator}
          className="px-6"
        >
          Reset
        </Button>
      </div>

      {/* Summary Card - Only shows after calculation */}
      {calculated && results && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-500 rounded-xl p-4 space-y-3 max-w-xl mx-auto">
          <h4 className="text-lg font-bold text-slate-800 dark:text-white text-center">Summary</h4>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-green-700 dark:text-green-400 font-medium">Total Usage:</span>
            <span className="text-slate-700 dark:text-slate-300">{results.totalUsage.toFixed(0)} kWh</span>
            
            <span className="text-green-700 dark:text-green-400 font-medium">TOU Cost:</span>
            <span className="text-slate-700 dark:text-slate-300">${results.touCost.toFixed(2)}</span>
            
            <span className="text-green-700 dark:text-green-400 font-medium">ULO Cost:</span>
            <span className="text-slate-700 dark:text-slate-300">${results.uloCost.toFixed(2)}</span>
            
            <span className="text-green-700 dark:text-green-400 font-medium">Avg Monthly Savings:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">${results.avgMonthlySavings.toFixed(2)}</span>
            
            <span className="text-green-700 dark:text-green-400 font-medium">Peak Hrs Daily Avg:</span>
            <span className="text-slate-700 dark:text-slate-300">{results.peakHrsDailyAvg.toFixed(2)} kWh</span>
            
            <span className="text-green-700 dark:text-green-400 font-medium">Smart Battery Required:</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{results.recommendedBattery} kWh</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Visual illustration components for each category
const HVACIllustration = ({ savings }) => (
  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 overflow-hidden">
    <div className="flex items-center justify-between">
      {/* Old System */}
      <div className="text-center">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-2 relative">
          <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
        </div>
        <p className="text-xs text-slate-500 font-medium">Gas Furnace</p>
        <p className="text-sm font-bold text-red-500">High Cost</p>
      </div>
      
      {/* Arrow */}
      <div className="flex flex-col items-center px-4">
        <ArrowRight className="w-8 h-8 text-emerald-500" />
        <span className="text-xs text-emerald-600 font-bold mt-1">UPGRADE</span>
      </div>
      
      {/* New System */}
      <div className="text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2 relative">
          <div className="relative">
            <Snowflake className="w-6 h-6 text-blue-500 absolute -top-2 -left-2 animate-spin" style={{ animationDuration: '3s' }} />
            <Wind className="w-10 h-10 text-emerald-500" />
            <Flame className="w-5 h-5 text-orange-400 absolute -bottom-1 -right-1" />
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">Heat Pump</p>
        <p className="text-sm font-bold text-emerald-500">-${savings}/mo</p>
      </div>
    </div>
    
    {/* Energy flow animation */}
    <div className="mt-4 h-2 bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-pulse" style={{ width: '70%' }} />
    </div>
    <p className="text-xs text-center mt-2 text-slate-500">Energy efficiency: 300-400% vs 95%</p>
  </div>
);

const InsulationIllustration = ({ savings }) => (
  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 overflow-hidden">
    <div className="flex items-center justify-between">
      {/* Poor Insulation */}
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-2 relative">
          <Home className="w-10 h-10 text-slate-400" />
          {/* Heat escaping */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <ArrowDown className="w-4 h-4 text-red-500 rotate-180 animate-bounce" />
          </div>
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
            <ArrowRight className="w-4 h-4 text-red-500 rotate-180 animate-pulse" />
          </div>
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
            <ArrowRight className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">Heat Loss</p>
        <p className="text-sm font-bold text-red-500">Wasted $</p>
      </div>
      
      {/* Arrow */}
      <div className="flex flex-col items-center px-4">
        <ArrowRight className="w-8 h-8 text-[#FF69B4]" />
        <span className="text-xs text-[#FF69B4] font-bold mt-1">INSULATE</span>
      </div>
      
      {/* Good Insulation */}
      <div className="text-center">
        <div className="w-20 h-20 bg-[#FFE4EC] dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-2 relative border-4 border-[#FF69B4] border-dashed">
          <Home className="w-10 h-10 text-[#FF69B4]" />
          <div className="absolute inset-0 rounded-lg bg-[#FF69B4]/10 animate-pulse" />
        </div>
        <p className="text-xs text-slate-500 font-medium">Sealed Home</p>
        <p className="text-sm font-bold text-[#FF69B4]">-${savings}/mo</p>
      </div>
    </div>
    
    {/* R-Value indicator */}
    <div className="mt-4 flex items-center gap-2">
      <span className="text-xs text-slate-500">R-Value:</span>
      <div className="flex-1 h-3 bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#FF69B4] to-[#FF1493] rounded-full" style={{ width: '85%' }} />
      </div>
      <span className="text-xs font-bold text-[#FF69B4]">R-60</span>
    </div>
  </div>
);

const HotWaterIllustration = ({ savings }) => (
  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 overflow-hidden">
    <div className="flex items-center justify-between">
      {/* Old Tank */}
      <div className="text-center">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-2 relative">
          <div className="w-12 h-14 bg-slate-400 rounded-lg relative">
            <Flame className="w-6 h-6 text-orange-500 absolute -bottom-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">24/7</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">Gas Tank</p>
        <p className="text-sm font-bold text-red-500">Always On</p>
      </div>
      
      {/* Arrow */}
      <div className="flex flex-col items-center px-4">
        <ArrowRight className="w-8 h-8 text-blue-500" />
        <span className="text-xs text-blue-600 font-bold mt-1">UPGRADE</span>
      </div>
      
      {/* Tankless Water Heater */}
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2 relative">
          <div className="w-14 h-10 bg-blue-500 rounded-lg relative flex items-center justify-center">
            <Droplet className="w-5 h-5 text-white" />
            <Flame className="w-4 h-4 text-orange-400 absolute -bottom-1 left-1/2 transform -translate-x-1/2" />
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">Tankless</p>
        <p className="text-sm font-bold text-blue-500">-${savings}/mo</p>
      </div>
    </div>
    
    {/* On-demand explanation */}
    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
      <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
        <span className="font-semibold">On-Demand Hot Water:</span> Only heats water when you need it, eliminating standby heat loss from keeping a tank hot 24/7
      </p>
    </div>
    
    {/* Comparison */}
    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
      <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-2">
        <p className="text-xs text-slate-500">Tank (Always On)</p>
        <p className="text-sm font-bold text-red-500">Wasted Energy</p>
      </div>
      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
        <p className="text-xs text-blue-500">Tankless (On Demand)</p>
        <p className="text-sm font-bold text-blue-600">No Waste</p>
      </div>
    </div>
  </div>
);

const SolarIllustration = ({ savings }) => (
  <div className="relative bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 overflow-hidden">
    {/* Sun */}
    <div className="absolute top-2 right-4">
      <Sun className="w-12 h-12 text-yellow-400 animate-spin" style={{ animationDuration: '10s' }} />
      <div className="absolute inset-0 w-12 h-12 bg-yellow-400/30 rounded-full animate-ping" />
    </div>
    
    <div className="flex items-center gap-4">
      {/* House with panels */}
      <div className="relative">
        <div className="w-24 h-16 bg-slate-300 dark:bg-slate-600 rounded-t-lg relative">
          {/* Roof */}
          <div className="absolute -top-6 left-0 right-0 h-8 bg-slate-400 dark:bg-slate-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
            {/* Solar panels */}
            <div className="absolute top-2 left-3 right-3 grid grid-cols-3 gap-0.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-2 bg-blue-900 rounded-sm border border-blue-700" />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Energy flow */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full animate-pulse" style={{ width: '80%' }} />
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">Free electricity from the sun</p>
        <p className="text-lg font-bold text-yellow-600 mt-1">-${savings}/mo</p>
      </div>
    </div>
    
    {/* Production stats */}
    <div className="mt-4 flex gap-2">
      <div className="flex-1 bg-white/60 dark:bg-slate-700/60 rounded-lg p-2 text-center">
        <p className="text-xs text-slate-500">Daily Production</p>
        <p className="text-sm font-bold text-yellow-600">~25 kWh</p>
      </div>
      <div className="flex-1 bg-white/60 dark:bg-slate-700/60 rounded-lg p-2 text-center">
        <p className="text-xs text-slate-500">CO₂ Avoided</p>
        <p className="text-sm font-bold text-green-600">8 tons/yr</p>
      </div>
    </div>
  </div>
);

const BatteryIllustration = ({ savings }) => (
  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 overflow-hidden">
    <div className="flex items-center gap-4">
      {/* Battery visualization */}
      <div className="relative">
        <div className="w-16 h-24 bg-slate-300 dark:bg-slate-600 rounded-lg border-4 border-slate-400 dark:border-slate-500 relative overflow-hidden">
          {/* Battery cap */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-slate-400 dark:bg-slate-500 rounded-t-lg" />
          {/* Charge level */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 transition-all duration-1000" style={{ height: '75%' }}>
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
          {/* Charge indicator */}
          <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white drop-shadow-lg" />
        </div>
        <p className="text-xs text-center mt-1 text-slate-500">75% Full</p>
      </div>
      
      {/* Benefits */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-700 dark:text-green-400">Store solar energy</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs text-blue-700 dark:text-blue-400">Use during peak rates</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-xs text-amber-700 dark:text-amber-400">Backup power</span>
        </div>
      </div>
    </div>
    
    <div className="mt-4 text-center">
      <p className="text-xs text-slate-500">Estimated monthly savings</p>
      <p className="text-xl font-bold text-green-600">-${savings}/mo</p>
    </div>
  </div>
);

const illustrations = {
  hvac: HVACIllustration,
  insulation: InsulationIllustration,
  hotwater: HotWaterIllustration,
  solar: SolarIllustration,
  battery: BatteryIllustration,
};

// Video explainers for each category
const categoryVideos = {
  hvac: {
    title: "How Heat Pumps Save You Money",
    description: "Learn how modern heat pumps deliver 3-4x more heating efficiency than traditional furnaces",
    thumbnail: "https://img.youtube.com/vi/7J52mDjZzto/maxresdefault.jpg",
    videoId: "7J52mDjZzto",
  },
  insulation: {
    title: "The Power of Proper Insulation",
    description: "See how attic and wall insulation keeps your home comfortable year-round",
    thumbnail: "https://img.youtube.com/vi/wEoG4K7xpA4/maxresdefault.jpg",
    videoId: "wEoG4K7xpA4",
  },
  hotwater: {
    title: "Tankless Water Heaters Explained",
    description: "Discover why tankless water heaters save money with on-demand hot water",
    thumbnail: "https://img.youtube.com/vi/bBc_GwOzEFY/maxresdefault.jpg",
    videoId: "bBc_GwOzEFY",
  },
  solar: {
    title: "Solar Panels: Your Home Power Plant",
    description: "See how solar panels generate free electricity from sunlight",
    thumbnail: "https://img.youtube.com/vi/xKxrkht7CpY/maxresdefault.jpg",
    videoId: "xKxrkht7CpY",
  },
  battery: {
    title: "Home Batteries & Energy Independence",
    description: "Learn how batteries store solar energy and provide backup power",
    thumbnail: "https://img.youtube.com/vi/IbSITcnL2YE/maxresdefault.jpg",
    videoId: "IbSITcnL2YE",
  },
};

// Collapsible Video Button Component
const CollapsibleVideoSection = ({ video, color, onPlay }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between border-2 ${isOpen ? 'border-slate-400' : 'border-slate-200 dark:border-slate-700'} hover:border-slate-400 transition-colors`}
        >
          <span className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Watch Explainer Video
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div 
          onClick={onPlay}
          className="relative bg-slate-900 rounded-2xl overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300"
        >
          <div className="relative aspect-video">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r ${color} flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform`}>
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
              </div>
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
          {/* Video info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white font-semibold text-sm md:text-base">{video.title}</p>
            <p className="text-white/70 text-xs md:text-sm mt-1">{video.description}</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export function Calculator() {
  const [data, setData] = useState({
    squareFootage: "1500-2000",
    gasBill: 150,
    electricityBill: 100,
    heatingSystemAge: 15,
    acAge: 10,
    waterHeaterAge: 10,
    insulation: 3,
    heatingSource: "gas",
    heatingSystem: "furnace",
    oesp: false,
  });

  const [activeTab, setActiveTab] = useState("hvac");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const handlePlayVideo = (video) => {
    setActiveVideo(video);
    setVideoModalOpen(true);
  };

  // Equipment costs for each category
  const equipmentCosts = {
    hvac: 15000,
    insulation: 8000,
    hotwater: 5000,
    solar: 25000,
    battery: 12000,
  };

  // OESP rebate amount
  const OESP_REBATE = 55;

  // Calculate savings for each category
  const calculateCategorySavings = (categoryId) => {
    const { gasBill, electricityBill, insulation, heatingSource, oesp } = data;
    const cost = equipmentCosts[categoryId];
    const monthlyPayment = calculateMonthlyPayment(cost);
    
    let monthlySavings = 0;
    let description = "";
    
    switch (categoryId) {
      case "hvac":
        if (heatingSource === "electricity") {
          monthlySavings = Math.round(electricityBill * 0.4);
          description = "Heat pump efficiency savings";
        } else {
          monthlySavings = Math.round(gasBill * 0.8);
          description = "Switch from gas to efficient heat pump";
        }
        break;
      
      case "insulation":
        const insulationFactor = (5 - insulation) * 0.08;
        monthlySavings = Math.round((gasBill + electricityBill) * insulationFactor);
        description = "Better insulation reduces heating/cooling loss";
        break;
      
      case "hotwater":
        monthlySavings = heatingSource !== "electricity" ? Math.round(gasBill * 0.25) : Math.round(electricityBill * 0.15);
        description = "Tankless on-demand water heating eliminates standby loss";
        break;
      
      case "solar":
        monthlySavings = Math.round(electricityBill * 0.7);
        description = "Generate your own clean electricity";
        break;
      
      case "battery":
        monthlySavings = Math.round(electricityBill * 0.15);
        description = "Store solar energy & backup power";
        break;
      
      default:
        break;
    }
    
    // Add OESP rebate if enabled
    const oespRebate = oesp ? OESP_REBATE : 0;
    const totalMonthlySavings = monthlySavings + oespRebate;
    const netMonthlySavings = totalMonthlySavings - monthlyPayment;
    
    return { 
      monthly: monthlySavings, 
      oespRebate,
      totalMonthly: totalMonthlySavings,
      yearly: totalMonthlySavings * 12, 
      cost, 
      monthlyPayment,
      netMonthly: netMonthlySavings,
      description 
    };
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeTab);
  const currentSavings = calculateCategorySavings(activeTab);
  const IllustrationComponent = illustrations[activeTab];
  const currentVideo = categoryVideos[activeTab];

  return (
    <>
      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0 overflow-hidden">
          <button
            onClick={() => setVideoModalOpen(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {activeVideo && (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    <div className="space-y-6">
      {/* Home Details Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Home className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <CardTitle className="text-base md:text-lg">Your Home Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">Square Footage</Label>
              <select
                value={data.squareFootage}
                onChange={(e) => setData({ ...data, squareFootage: e.target.value })}
                className="flex h-9 md:h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Square Footage"
              >
                <option value="" disabled>Select</option>
                <option value="under-1000">Under 1,000</option>
                <option value="1000-1500">1,000-1,500</option>
                <option value="1500-2000">1,500-2,000</option>
                <option value="2000-2500">2,000-2,500</option>
                <option value="2500-3000">2,500-3,000</option>
                <option value="3000-4000">3,000-4,000</option>
                <option value="over-4000">Over 4,000</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">Heating Source</Label>
              <select
                value={data.heatingSource}
                onChange={(e) => setData({ ...data, heatingSource: e.target.value })}
                className="flex h-9 md:h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Heating Source"
              >
                <option value="" disabled>Select</option>
                <option value="gas">Natural Gas</option>
                <option value="electricity">Electricity</option>
                <option value="oil">Oil</option>
                <option value="propane">Propane</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">Heating System</Label>
              <select
                value={data.heatingSystem}
                onChange={(e) => setData({ ...data, heatingSystem: e.target.value })}
                className="flex h-9 md:h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Heating System"
              >
                <option value="" disabled>Select</option>
                <option value="furnace">Furnace</option>
                <option value="boiler">Boiler</option>
                <option value="baseboard">Baseboard</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                {data.heatingSource === "gas" ? "Gas" : data.heatingSource === "electricity" ? "Electric" : data.heatingSource === "oil" ? "Oil" : "Propane"} Bill
              </Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                <Input
                  type="number"
                  value={data.gasBill}
                  onChange={(e) => setData({ ...data, gasBill: Number(e.target.value) })}
                  className="pl-5 h-9 md:h-10 rounded-lg border-slate-200 dark:border-slate-700 text-xs md:text-sm"
                  placeholder="Monthly"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">Electric Bill</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                <Input
                  type="number"
                  value={data.electricityBill}
                  onChange={(e) => setData({ ...data, electricityBill: Number(e.target.value) })}
                  className="pl-5 h-9 md:h-10 rounded-lg border-slate-200 dark:border-slate-700 text-xs md:text-sm"
                  placeholder="Monthly"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Current Insulation Quality
            </Label>
            <Slider
              value={[data.insulation]}
              onValueChange={(value) => setData({ ...data, insulation: value[0] })}
              max={5}
              min={1}
              step={1}
              className={`w-full ${
                data.insulation === 1 ? '[&_[role=slider]]:bg-slate-400 [&_.bg-primary]:bg-slate-400' :
                data.insulation === 2 ? '[&_[role=slider]]:bg-pink-300 [&_.bg-primary]:bg-pink-300' :
                data.insulation === 3 ? '[&_[role=slider]]:bg-pink-400 [&_.bg-primary]:bg-pink-400' :
                data.insulation === 4 ? '[&_[role=slider]]:bg-pink-500 [&_.bg-primary]:bg-pink-500' :
                '[&_[role=slider]]:bg-pink-600 [&_.bg-primary]:bg-pink-600'
              }`}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span className={data.insulation === 1 ? 'font-semibold text-slate-700' : ''}>Poor</span>
              <span className={data.insulation === 2 ? 'font-semibold text-pink-500' : ''}>Fair</span>
              <span className={data.insulation === 3 ? 'font-semibold text-pink-500' : ''}>Good</span>
              <span className={data.insulation === 4 ? 'font-semibold text-pink-600' : ''}>Great</span>
              <span className={data.insulation === 5 ? 'font-semibold text-pink-700' : ''}>Excellent</span>
            </div>
          </div>

          <div className="p-2 md:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Label className="text-xs md:text-sm font-medium text-emerald-700 dark:text-emerald-400 leading-tight block">
                  OESP Rebate
                </Label>
                <p className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-500 leading-tight">
                  Bill credits for eligible households
                </p>
              </div>
              <Switch
                checked={data.oesp}
                onCheckedChange={(checked) => setData({ ...data, oesp: checked })}
                className="data-[state=checked]:bg-emerald-500 shrink-0"
              />
            </div>
            {data.oesp && (
              <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                <p className="text-[10px] md:text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">+$55/month rebate applied</span> (ranges $35-$75)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs - Connected Design */}
      <div className="relative">
        {/* Tab Headers */}
        <div className="flex gap-0">
          {CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            const isActive = activeTab === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 md:gap-1 py-2 md:py-3 px-1 md:px-2 transition-all relative ${
                  isActive 
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg z-10` 
                    : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                } ${index === 0 ? 'rounded-tl-xl md:rounded-tl-2xl' : ''} ${index === CATEGORIES.length - 1 ? 'rounded-tr-xl md:rounded-tr-2xl' : ''}`}
              >
                <Icon className="w-5 h-5 md:w-5 md:h-5" />
                <span className="hidden md:block text-xs font-medium whitespace-nowrap">{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content - Connected to header */}
        <Card className={`border-0 shadow-xl rounded-t-none overflow-hidden`}>
          {/* Colored header bar */}
          <div className={`bg-gradient-to-r ${currentCategory.color} p-6 md:p-8`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = currentCategory.icon; return <Icon className="w-8 h-8" />; })()}
                  <h3 className="text-2xl font-bold">{currentCategory.name}</h3>
                </div>
                <p className="text-white/80 text-sm max-w-md">{currentSavings.description}</p>
              </div>
              
              {activeTab !== "battery" && (
                <div className="flex gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[120px]">
                    <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Total Savings</p>
                    <p className="text-3xl font-bold text-white">${currentSavings.totalMonthly}</p>
                    <p className="text-white/60 text-xs">/month</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[120px]">
                    <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Equipment</p>
                    <p className="text-3xl font-bold text-white">${currentSavings.monthlyPayment}</p>
                    <p className="text-white/60 text-xs">/month</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Video Explainer Section - At top, collapsed by default */}
            <CollapsibleVideoSection 
              video={currentVideo} 
              color={currentCategory.color}
              onPlay={() => handlePlayVideo(currentVideo)}
            />

            {/* How it Works - Visual Illustration for all categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">How it Works</h4>
              <IllustrationComponent savings={currentSavings.monthly} />
            </div>

            {/* Battery Tab gets special calculator */}
            {activeTab === "battery" && (
              <BatteryCalculator onSavingsCalculated={(savings) => {
                // Update battery savings dynamically if needed
              }} />
            )}

            {/* Financial Breakdown - hide for battery tab */}
            {activeTab !== "battery" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Breakdown */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Monthly Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Energy Savings</span>
                      <span className="text-lg font-bold text-emerald-500">+${currentSavings.monthly}</span>
                    </div>
                    {currentSavings.oespRebate > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">OESP Rebate</span>
                        <span className="text-lg font-bold text-emerald-500">+${currentSavings.oespRebate}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Equipment Payment</span>
                      <span className="text-lg font-bold text-slate-700 dark:text-slate-300">-${currentSavings.monthlyPayment}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Net Monthly</span>
                        <span className={`text-xl font-bold ${currentSavings.netMonthly >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {currentSavings.netMonthly >= 0 ? '+' : ''}${currentSavings.netMonthly.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">*2.99% APR over 240 months</p>
                </div>

                {/* Long-term Value */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    Long-term Value
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Equipment Cost</span>
                      <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        ${currentSavings.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">20-Year Savings</span>
                      <span className="text-lg font-bold text-emerald-500">
                        ${(currentSavings.yearly * 20).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Net Benefit (20yr)</span>
                      <span className="text-lg font-bold text-emerald-500">
                        ${((currentSavings.yearly * 20) - (currentSavings.monthlyPayment * 240)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category-specific inputs */}
            {activeTab === "hvac" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600 dark:text-slate-400">
                    {data.heatingSystem === "furnace" ? "Furnace" : data.heatingSystem === "boiler" ? "Boiler" : "Heating System"} Age (years)
                  </Label>
                  <Input
                    type="number"
                    value={data.heatingSystemAge}
                    onChange={(e) => setData({ ...data, heatingSystemAge: Number(e.target.value) })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600 dark:text-slate-400">AC Age (years)</Label>
                  <Input
                    type="number"
                    value={data.acAge}
                    onChange={(e) => setData({ ...data, acAge: Number(e.target.value) })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            )}

            {activeTab === "hotwater" && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="space-y-2 max-w-xs">
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Water Heater Age (years)</Label>
                  <Input
                    type="number"
                    value={data.waterHeaterAge}
                    onChange={(e) => setData({ ...data, waterHeaterAge: Number(e.target.value) })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Incentives - Compact Coupon Style */}
            <div className="flex items-center bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-amber-900/20 border border-dashed border-amber-400 dark:border-amber-600 rounded-lg overflow-hidden">
              {/* Scissors icon */}
              <div className="px-2 border-r border-dashed border-amber-400 dark:border-amber-600 self-stretch flex items-center">
                <span className="text-amber-500 text-sm">✂️</span>
              </div>
              
              {/* Coupon content */}
              <div className="flex-1 flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">Rebate Available</p>
                  <p className="text-xs md:text-sm font-medium text-amber-800 dark:text-amber-300 truncate">
                    {activeTab === "hvac" && "Up to $6,500 Ontario + federal grants"}
                    {activeTab === "insulation" && "Up to $5,000 Greener Homes Grant"}
                    {activeTab === "hotwater" && "Up to $5,000 for tankless heaters"}
                    {activeTab === "solar" && "Federal + Ontario solar rebates"}
                    {activeTab === "battery" && "Up to $5,000 battery rebate"}
                  </p>
                </div>
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs px-3 py-1.5 h-auto rounded-md shadow shrink-0"
                >
                  Redeem
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}