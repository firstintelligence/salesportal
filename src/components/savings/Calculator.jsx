import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Home, DollarSign, Zap, Wind, Sun, Battery, HomeIcon, AlertCircle, Droplet } from "lucide-react";

const PRODUCTS = [
  { id: "hvac", name: "Heating/Cooling", icon: Wind },
  { id: "insulation", name: "Insulation", icon: HomeIcon },
  { id: "hotwater", name: "Hot Water", icon: Droplet },
  { id: "solar", name: "Solar Panels", icon: Sun },
  { id: "battery", name: "Home Battery", icon: Battery },
];

export function Calculator({ onComplete }) {
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
    selectedProducts: [],
    oesp: false,
  });

  const toggleProduct = (productId) => {
    setData({
      ...data,
      selectedProducts: data.selectedProducts.includes(productId)
        ? data.selectedProducts.filter((id) => id !== productId)
        : [...data.selectedProducts, productId],
    });
  };

  // Product suggestions based on home characteristics
  const getSuggestions = () => {
    const suggestions = [];
    
    if (!data.selectedProducts.includes("hvac") && data.heatingSource !== "electricity" && data.heatingSystemAge > 10) {
      suggestions.push({
        id: "hvac",
        reason: "Heat pump can reduce your gas/oil costs by up to 80% while providing efficient heating and cooling",
        incentive: "Up to $6,500 Ontario rebate"
      });
    }
    
    const totalBill = data.gasBill + data.electricityBill;
    if (!data.selectedProducts.includes("solar") && totalBill > 200) {
      suggestions.push({
        id: "solar",
        reason: "High energy bills make solar panels a great investment",
        incentive: "Federal grants + Ontario rebates available"
      });
    }
    
    if (!data.selectedProducts.includes("insulation") && data.insulation < 3) {
      suggestions.push({
        id: "insulation",
        reason: "Poor insulation is costing you money every month",
        incentive: "Up to $5,000 Greener Homes Grant"
      });
    }
    
    if (!data.selectedProducts.includes("battery")) {
      suggestions.push({
        id: "battery",
        reason: "Battery storage provides backup power and maximizes solar investment",
        incentive: "Ontario rebates up to $5,000"
      });
    }
    
    if (!data.selectedProducts.includes("hotwater") && data.heatingSource !== "electricity") {
      suggestions.push({
        id: "hotwater",
        reason: "Hot water heat pump can reduce water heating costs significantly",
        incentive: "Up to $5,000 Greener Homes Grant"
      });
    }
    
    return suggestions;
  };

  const suggestions = getSuggestions();

  const handleSubmit = () => {
    onComplete(data);
  };

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Select Categories to Evaluate</CardTitle>
          <CardDescription>Choose which upgrades you'd like to explore for your home</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {PRODUCTS.map((product) => {
              const Icon = product.icon;
              const isSelected = data.selectedProducts.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`cursor-pointer p-4 md:p-6 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-500/10 shadow-md"
                      : "border-border hover:border-green-500/30"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Icon className={`w-8 h-8 md:w-10 md:h-10 ${isSelected ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className={`text-xs md:text-sm font-semibold ${isSelected ? "text-green-500" : "text-muted-foreground"}`}>
                      {product.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Home Details
          </CardTitle>
          <CardDescription>Tell us about your property</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sqft" className="text-base font-medium">
                Square Footage
              </Label>
              <select
                id="sqft"
                value={data.squareFootage}
                onChange={(e) => setData({ ...data, squareFootage: e.target.value })}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="heatingSource" className="text-base font-medium">
                Heating Source
              </Label>
              <select
                id="heatingSource"
                value={data.heatingSource}
                onChange={(e) => setData({ ...data, heatingSource: e.target.value })}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="gas">Gas</option>
                <option value="electricity">Electricity</option>
                <option value="oil">Oil</option>
                <option value="propane">Propane</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heatingSystem" className="text-base font-medium">
                Heating System
              </Label>
              <select
                id="heatingSystem"
                value={data.heatingSystem}
                onChange={(e) => setData({ ...data, heatingSystem: e.target.value })}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="furnace">Furnace</option>
                <option value="boiler">Boiler/Radiators</option>
                <option value="baseboard">Baseboard Only</option>
                <option value="both">Both Furnace & Baseboard</option>
              </select>
            </div>
          </div>

          {/* Age fields - only show when relevant products selected */}
          {data.selectedProducts.includes("hvac") && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="heatingSystemAge" className="text-base font-medium">
                  {data.heatingSystem === "furnace" ? "Furnace Age (years)" :
                   data.heatingSystem === "boiler" ? "Boiler Age (years)" :
                   data.heatingSystem === "baseboard" ? "Baseboard Age (years)" :
                   data.heatingSystem === "both" ? "Furnace Age (years)" : "Heating System Age (years)"}
                </Label>
                <Input
                  id="heatingSystemAge"
                  type="number"
                  inputMode="numeric"
                  value={data.heatingSystemAge}
                  onChange={(e) => setData({ ...data, heatingSystemAge: Number(e.target.value) })}
                  className="text-base h-12"
                />
              </div>

              {data.heatingSystem === "both" && (
                <div className="space-y-2">
                  <Label htmlFor="baseboardAge" className="text-base font-medium">
                    Baseboard Age (years)
                  </Label>
                  <Input
                    id="baseboardAge"
                    type="number"
                    inputMode="numeric"
                    value={data.heatingSystemAge}
                    onChange={(e) => setData({ ...data, heatingSystemAge: Number(e.target.value) })}
                    className="text-base h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="acAge" className="text-base font-medium">
                  AC Age (years)
                </Label>
                <Input
                  id="acAge"
                  type="number"
                  inputMode="numeric"
                  value={data.acAge}
                  onChange={(e) => setData({ ...data, acAge: Number(e.target.value) })}
                  className="text-base h-12"
                />
              </div>
            </div>
          )}

          {data.selectedProducts.includes("hotwater") && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="waterHeaterAge" className="text-base font-medium">
                  Water Heater Age (years)
                </Label>
                <Input
                  id="waterHeaterAge"
                  type="number"
                  inputMode="numeric"
                  value={data.waterHeaterAge}
                  onChange={(e) => setData({ ...data, waterHeaterAge: Number(e.target.value) })}
                  className="text-base h-12"
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {data.heatingSource !== "electricity" && (
              <div className="space-y-2">
                <Label htmlFor="gasBill" className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Average Monthly {data.heatingSource === "gas" ? "Gas" : data.heatingSource === "oil" ? "Oil" : "Propane"} Bill
                </Label>
                <Input
                  id="gasBill"
                  type="number"
                  inputMode="numeric"
                  value={data.gasBill}
                  onChange={(e) => setData({ ...data, gasBill: Number(e.target.value) })}
                  className="text-base h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="electricityBill" className="text-base font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Average Monthly Electricity Bill
              </Label>
              <Input
                id="electricityBill"
                type="number"
                inputMode="numeric"
                value={data.electricityBill}
                onChange={(e) => setData({ ...data, electricityBill: Number(e.target.value) })}
                className="text-base h-12"
              />
            </div>
          </div>

          <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
            data.oesp ? "bg-green-500/10 border-green-500/30" : "bg-secondary/20"
          }`}>
            <div className="space-y-0.5">
              <Label htmlFor="oesp" className="text-base font-medium">
                Ontario Electricity Support Program (OESP)
              </Label>
              <p className="text-sm text-muted-foreground">
                Eligible households can receive monthly electricity bill credits
              </p>
            </div>
            <Switch
              id="oesp"
              checked={data.oesp}
              onCheckedChange={(checked) => setData({ ...data, oesp: checked })}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Current Insulation Level
            </Label>
            <Slider
              value={[data.insulation]}
              onValueChange={(value) => setData({ ...data, insulation: value[0] })}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Very Good</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Product Suggestions */}
          {suggestions.length > 0 && (
            <Card className="border-2 border-amber-500/50 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  Recommended Additions
                </CardTitle>
                <CardDescription>Based on your home profile, these products could help you save more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.map((suggestion) => {
                  const product = PRODUCTS.find((p) => p.id === suggestion.id);
                  if (!product) return null;
                  const Icon = product.icon;
                  return (
                    <div
                      key={suggestion.id}
                      className="flex items-start gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => toggleProduct(suggestion.id)}
                    >
                      <Icon className="w-5 h-5 mt-0.5 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">{suggestion.incentive}</Badge>
                      </div>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-lg"
            size="lg"
          >
            Calculate Savings
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
