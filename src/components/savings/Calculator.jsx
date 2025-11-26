import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Home, DollarSign, Zap, Wind, Sun, Battery, Droplet, TrendingDown, Leaf, ThermometerSun, Flame, Snowflake, ArrowRight, ArrowDown } from "lucide-react";

const CATEGORIES = [
  { id: "hvac", name: "Heating & Cooling", icon: Wind, color: "from-red-500 to-rose-500", bgColor: "bg-red-500", borderColor: "border-red-500" },
  { id: "insulation", name: "Insulation", icon: Home, color: "from-[#FF69B4] to-[#FF1493]", bgColor: "bg-[#FF69B4]", borderColor: "border-[#FF69B4]" },
  { id: "hotwater", name: "Hot Water", icon: Droplet, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500", borderColor: "border-blue-500" },
  { id: "solar", name: "Solar Panels", icon: Sun, color: "from-yellow-300 to-yellow-500", bgColor: "bg-yellow-400", borderColor: "border-yellow-400" },
  { id: "battery", name: "Home Battery", icon: Battery, color: "from-green-500 to-emerald-500", bgColor: "bg-green-500", borderColor: "border-green-500" },
];

// Calculate monthly payment with 2.99% interest over 240 months
const calculateMonthlyPayment = (principal) => {
  const annualRate = 0.0299;
  const monthlyRate = annualRate / 12;
  const numPayments = 240;
  
  if (principal <= 0) return 0;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(payment * 100) / 100;
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
        </div>
        <p className="text-xs text-slate-500 font-medium">Gas Tank</p>
        <p className="text-sm font-bold text-red-500">Always On</p>
      </div>
      
      {/* Arrow */}
      <div className="flex flex-col items-center px-4">
        <ArrowRight className="w-8 h-8 text-blue-500" />
        <span className="text-xs text-blue-600 font-bold mt-1">UPGRADE</span>
      </div>
      
      {/* Heat Pump Water Heater */}
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2 relative">
          <div className="w-12 h-14 bg-blue-400 rounded-lg relative">
            <Droplet className="w-6 h-6 text-white absolute top-1 left-1/2 transform -translate-x-1/2" />
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-cyan-400 rounded-t-lg flex items-center justify-center">
              <Wind className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">HP Water Heater</p>
        <p className="text-sm font-bold text-blue-500">-${savings}/mo</p>
      </div>
    </div>
    
    {/* Efficiency comparison */}
    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
      <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-2">
        <p className="text-xs text-slate-500">Old Efficiency</p>
        <p className="text-lg font-bold text-slate-600 dark:text-slate-300">60%</p>
      </div>
      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
        <p className="text-xs text-blue-500">New Efficiency</p>
        <p className="text-lg font-bold text-blue-600">300%+</p>
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
        monthlySavings = heatingSource !== "electricity" ? Math.round(gasBill * 0.3) : Math.round(electricityBill * 0.2);
        description = "Heat pump water heater efficiency";
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

  return (
    <div className="space-y-6">
      {/* Home Details Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Your Home Details</CardTitle>
              <CardDescription>Tell us about your property to calculate accurate savings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Square Footage</Label>
              <select
                value={data.squareFootage}
                onChange={(e) => setData({ ...data, squareFootage: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="under-1000">Under 1,000 sq ft</option>
                <option value="1000-1500">1,000 - 1,500 sq ft</option>
                <option value="1500-2000">1,500 - 2,000 sq ft</option>
                <option value="2000-2500">2,000 - 2,500 sq ft</option>
                <option value="2500-3000">2,500 - 3,000 sq ft</option>
                <option value="3000-4000">3,000 - 4,000 sq ft</option>
                <option value="over-4000">Over 4,000 sq ft</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Heating Source</Label>
              <select
                value={data.heatingSource}
                onChange={(e) => setData({ ...data, heatingSource: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="gas">Natural Gas</option>
                <option value="electricity">Electricity</option>
                <option value="oil">Oil</option>
                <option value="propane">Propane</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Heating System</Label>
              <select
                value={data.heatingSystem}
                onChange={(e) => setData({ ...data, heatingSystem: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="furnace">Furnace</option>
                <option value="boiler">Boiler/Radiators</option>
                <option value="baseboard">Baseboard Only</option>
                <option value="both">Furnace & Baseboard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Monthly {data.heatingSource === "gas" ? "Gas" : data.heatingSource === "electricity" ? "Electric Heat" : data.heatingSource === "oil" ? "Oil" : "Propane"} Bill
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  type="number"
                  value={data.gasBill}
                  onChange={(e) => setData({ ...data, gasBill: Number(e.target.value) })}
                  className="pl-7 h-11 rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Monthly Electricity Bill
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  type="number"
                  value={data.electricityBill}
                  onChange={(e) => setData({ ...data, electricityBill: Number(e.target.value) })}
                  className="pl-7 h-11 rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Current Insulation Quality
            </Label>
            <Slider
              value={[data.insulation]}
              onValueChange={(value) => setData({ ...data, insulation: value[0] })}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Very Good</span>
              <span>Excellent</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Ontario Electricity Support Program (OESP)
                </Label>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                  Monthly bill credits for eligible households
                </p>
              </div>
              <Switch
                checked={data.oesp}
                onCheckedChange={(checked) => setData({ ...data, oesp: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
            {data.oesp && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">+$55/month rebate applied.</span>
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 italic">
                  *This is an average amount. The actual rebate ranges from $35/month to $75/month depending on income level and number of people living in the home.
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
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-all relative ${
                  isActive 
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg z-10` 
                    : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                } ${index === 0 ? 'rounded-tl-2xl' : ''} ${index === CATEGORIES.length - 1 ? 'rounded-tr-2xl' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium whitespace-nowrap">{category.name}</span>
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
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Visual Illustration */}
            <IllustrationComponent savings={currentSavings.monthly} />

            {/* Financial Breakdown */}
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
                        {currentSavings.netMonthly >= 0 ? '+' : ''}${currentSavings.netMonthly}
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

            {/* Incentives */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-400 mb-2">Available Incentives</h4>
              <p className="text-sm text-amber-700 dark:text-amber-500">
                {activeTab === "hvac" && "Up to $6,500 Ontario rebate for heat pumps + federal grants"}
                {activeTab === "insulation" && "Up to $5,000 through the Greener Homes Grant program"}
                {activeTab === "hotwater" && "Up to $5,000 Greener Homes Grant for heat pump water heaters"}
                {activeTab === "solar" && "Federal grants + Ontario rebates available for solar installations"}
                {activeTab === "battery" && "Ontario rebates up to $5,000 for home battery storage"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}