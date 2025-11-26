import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, DollarSign, Zap, Wind, Sun, Battery, Droplet, TrendingDown, Leaf, ThermometerSun } from "lucide-react";

const CATEGORIES = [
  { id: "hvac", name: "Heating & Cooling", icon: Wind, color: "from-red-500 to-rose-500" },
  { id: "insulation", name: "Insulation", icon: Home, color: "from-pink-500 to-fuchsia-500" },
  { id: "hotwater", name: "Hot Water", icon: Droplet, color: "from-blue-500 to-cyan-500" },
  { id: "solar", name: "Solar Panels", icon: Sun, color: "from-yellow-400 to-amber-500" },
  { id: "battery", name: "Home Battery", icon: Battery, color: "from-green-500 to-emerald-500" },
];

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

  // Calculate savings for each category
  const calculateCategorySavings = (categoryId) => {
    const { gasBill, electricityBill, insulation, heatingSource } = data;
    
    switch (categoryId) {
      case "hvac":
        if (heatingSource === "electricity") {
          return { monthly: Math.round(electricityBill * 0.4), yearly: Math.round(electricityBill * 0.4 * 12), cost: 15000, description: "Heat pump efficiency savings" };
        }
        return { monthly: Math.round(gasBill * 0.8), yearly: Math.round(gasBill * 0.8 * 12), cost: 15000, description: "Switch from gas to efficient heat pump" };
      
      case "insulation":
        const insulationFactor = (5 - insulation) * 0.08;
        const insulationSavings = (gasBill + electricityBill) * insulationFactor;
        return { monthly: Math.round(insulationSavings), yearly: Math.round(insulationSavings * 12), cost: 8000, description: "Better insulation reduces heating/cooling loss" };
      
      case "hotwater":
        const hotWaterSavings = heatingSource !== "electricity" ? gasBill * 0.3 : electricityBill * 0.2;
        return { monthly: Math.round(hotWaterSavings), yearly: Math.round(hotWaterSavings * 12), cost: 5000, description: "Heat pump water heater efficiency" };
      
      case "solar":
        return { monthly: Math.round(electricityBill * 0.7), yearly: Math.round(electricityBill * 0.7 * 12), cost: 25000, description: "Generate your own clean electricity" };
      
      case "battery":
        return { monthly: Math.round(electricityBill * 0.15), yearly: Math.round(electricityBill * 0.15 * 12), cost: 12000, description: "Store solar energy & backup power" };
      
      default:
        return { monthly: 0, yearly: 0, cost: 0, description: "" };
    }
  };

  const currentSavings = calculateCategorySavings(activeTab);
  const currentCategory = CATEGORIES.find(c => c.id === activeTab);

  // Calculate percentage for visual
  const savingsPercentage = Math.min(100, Math.round((currentSavings.monthly / (data.gasBill + data.electricityBill)) * 100));

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

          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
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
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-slate-100 dark:bg-slate-800 p-2">
            <TabsList className="w-full h-auto flex flex-wrap gap-2 bg-transparent">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isActive = activeTab === category.id;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
                      isActive 
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg` 
                        : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const savings = calculateCategorySavings(category.id);
            const percentage = Math.min(100, Math.round((savings.monthly / (data.gasBill + data.electricityBill)) * 100));
            
            return (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                <div className={`bg-gradient-to-br ${category.color} p-6 md:p-8`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-8 h-8" />
                        <h3 className="text-2xl font-bold">{category.name}</h3>
                      </div>
                      <p className="text-white/80 text-sm max-w-md">{savings.description}</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[120px]">
                        <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Monthly</p>
                        <p className="text-3xl font-bold text-white">${savings.monthly}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[120px]">
                        <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Yearly</p>
                        <p className="text-3xl font-bold text-white">${savings.yearly}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Visual Savings Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Savings Meter */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Bill Reduction
                      </h4>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Current: ${data.gasBill + data.electricityBill}/mo
                          </span>
                          <span className="text-xs font-semibold text-emerald-600">
                            Save {percentage}%
                          </span>
                        </div>
                        <div className="overflow-hidden h-4 text-xs flex rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            style={{ width: `${percentage}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r ${category.color} transition-all duration-500`}
                          />
                        </div>
                        <div className="flex justify-between mt-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                              ${data.gasBill + data.electricityBill - savings.monthly}
                            </p>
                            <p className="text-xs text-slate-500">New Monthly Bill</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-500">
                              +${savings.yearly}
                            </p>
                            <p className="text-xs text-slate-500">Yearly Savings</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Investment & ROI */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                        <Leaf className="w-4 h-4" />
                        Investment & Return
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Estimated Cost</span>
                          <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            ${savings.cost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Payback Period</span>
                          <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            {savings.yearly > 0 ? `${(savings.cost / savings.yearly).toFixed(1)} years` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">10-Year Savings</span>
                          <span className="text-xl font-bold text-emerald-500">
                            ${((savings.yearly * 10) - savings.cost).toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <ThermometerSun className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {savings.yearly > 0 
                                ? `${Math.round((savings.yearly * 10 - savings.cost) / savings.cost * 100)}% return on investment`
                                : 'Backup power & peace of mind'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category-specific inputs */}
                  {category.id === "hvac" && (
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

                  {category.id === "hotwater" && (
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
                      {category.id === "hvac" && "Up to $6,500 Ontario rebate for heat pumps + federal grants"}
                      {category.id === "insulation" && "Up to $5,000 through the Greener Homes Grant program"}
                      {category.id === "hotwater" && "Up to $5,000 Greener Homes Grant for heat pump water heaters"}
                      {category.id === "solar" && "Federal grants + Ontario rebates available for solar installations"}
                      {category.id === "battery" && "Ontario rebates up to $5,000 for home battery storage"}
                    </p>
                  </div>
                </CardContent>
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    </div>
  );
}
