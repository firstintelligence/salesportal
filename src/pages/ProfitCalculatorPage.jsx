import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, DollarSign, Percent, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hvacProducts } from "@/utils/hvacProducts";

// Product presets with cost breakdowns
const productPresets = [
  {
    id: 'heat-pump-2-ton',
    name: '2 Ton Heat Pump',
    equipmentCost: 4500,
    laborCost: 2500,
    salePrice: 12500,
  },
  {
    id: 'heat-pump-3-ton',
    name: '3 Ton Heat Pump',
    equipmentCost: 5500,
    laborCost: 3000,
    salePrice: 15500,
  },
  {
    id: 'heat-pump-4-ton',
    name: '4 Ton Heat Pump',
    equipmentCost: 7000,
    laborCost: 3500,
    salePrice: 18500,
  },
  {
    id: 'heat-pump-5-ton',
    name: '5 Ton Heat Pump',
    equipmentCost: 8500,
    laborCost: 4000,
    salePrice: 22000,
  },
  {
    id: 'furnace-gas-95',
    name: 'Gas Furnace 95% AFUE',
    equipmentCost: 2200,
    laborCost: 1800,
    salePrice: 6500,
  },
  {
    id: 'furnace-gas-96',
    name: 'Gas Furnace 96% AFUE',
    equipmentCost: 2800,
    laborCost: 2000,
    salePrice: 7500,
  },
  {
    id: 'furnace-gas-98',
    name: 'Gas Furnace 98% AFUE',
    equipmentCost: 3800,
    laborCost: 2500,
    salePrice: 9500,
  },
  {
    id: 'navien-tankless-1-2-bath',
    name: 'Navien Tankless (1-2 Bath)',
    equipmentCost: 2200,
    laborCost: 1500,
    salePrice: 5800,
  },
  {
    id: 'navien-tankless-2-3-bath',
    name: 'Navien Tankless (2-3 Bath)',
    equipmentCost: 2600,
    laborCost: 1700,
    salePrice: 6500,
  },
  {
    id: 'navien-tankless-3-4-bath',
    name: 'Navien Tankless (3-4 Bath)',
    equipmentCost: 3000,
    laborCost: 1900,
    salePrice: 7200,
  },
  {
    id: 'navien-tankless-4-plus-bath',
    name: 'Navien Tankless (4+ Bath)',
    equipmentCost: 3500,
    laborCost: 2100,
    salePrice: 8200,
  },
  {
    id: 'cv40',
    name: 'CV40 Water Heater',
    equipmentCost: 1200,
    laborCost: 1000,
    salePrice: 3800,
  },
  {
    id: 'cv50',
    name: 'CV50 Water Heater',
    equipmentCost: 1400,
    laborCost: 1100,
    salePrice: 4100,
  },
  {
    id: 'pv40',
    name: 'PV40 Water Heater',
    equipmentCost: 1600,
    laborCost: 1200,
    salePrice: 4400,
  },
  {
    id: 'pv50',
    name: 'PV50 Water Heater',
    equipmentCost: 1800,
    laborCost: 1300,
    salePrice: 4700,
  },
  {
    id: 'rheem-proterra',
    name: 'Rheem ProTerra Heat Pump',
    equipmentCost: 3200,
    laborCost: 2000,
    salePrice: 7200,
  },
  {
    id: 'attic-insulation-1000',
    name: 'Attic Insulation (up to 1000 sq ft)',
    equipmentCost: 1500,
    laborCost: 2000,
    salePrice: 4500,
  },
  {
    id: 'attic-insulation-1000-plus',
    name: 'Attic Insulation (1000+ sq ft)',
    equipmentCost: 2500,
    laborCost: 2800,
    salePrice: 6500,
  },
  {
    id: 'custom',
    name: 'Custom / Manual Entry',
    equipmentCost: 0,
    laborCost: 0,
    salePrice: 0,
  },
];

const defaultDealData = {
  productPreset: '',
  dealSize: 0,
  equipmentCost: 0,
  laborCost: 0,
  financingCost: 0,
  dealerFee: 8,
  contractorFee: 15,
  commission: 10,
  marketingFee: 5,
};

const DealCalculator = ({ dealNumber, dealData, setDealData }) => {
  const handlePresetChange = (presetId) => {
    const preset = productPresets.find(p => p.id === presetId);
    if (preset) {
      setDealData({
        ...dealData,
        productPreset: presetId,
        dealSize: preset.salePrice,
        equipmentCost: preset.equipmentCost,
        laborCost: preset.laborCost,
      });
    }
  };

  const handleInputChange = (field, value) => {
    setDealData({
      ...dealData,
      [field]: parseFloat(value) || 0,
    });
  };

  // Calculate costs
  const dealerFeeCost = (dealData.dealSize * dealData.dealerFee) / 100;
  const contractorFeeCost = (dealData.dealSize * dealData.contractorFee) / 100;
  const commissionCost = (dealData.dealSize * dealData.commission) / 100;
  const marketingFeeCost = (dealData.dealSize * dealData.marketingFee) / 100;
  
  const totalCosts = 
    dealData.equipmentCost + 
    dealData.laborCost + 
    dealData.financingCost + 
    dealerFeeCost + 
    contractorFeeCost + 
    commissionCost + 
    marketingFeeCost;
  
  const grossProfit = dealData.dealSize - totalCosts;
  const profitMargin = dealData.dealSize > 0 ? (grossProfit / dealData.dealSize) * 100 : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          Option {dealNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Preset Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Package className="w-4 h-4" />
            Product Preset
          </Label>
          <Select value={dealData.productPreset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a product..." />
            </SelectTrigger>
            <SelectContent>
              {productPresets.map(preset => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deal Size */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <DollarSign className="w-4 h-4" />
            Deal Size (Sale Price)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              value={dealData.dealSize || ''}
              onChange={(e) => handleInputChange('dealSize', e.target.value)}
              className="pl-7"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Dollar Amount Fields */}
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fixed Costs ($)</p>
          
          <div className="space-y-2">
            <Label className="text-sm">Equipment Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={dealData.equipmentCost || ''}
                onChange={(e) => handleInputChange('equipmentCost', e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Labor / Installation Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={dealData.laborCost || ''}
                onChange={(e) => handleInputChange('laborCost', e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Financing Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={dealData.financingCost || ''}
                onChange={(e) => handleInputChange('financingCost', e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Percentage Fields */}
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3 h-3" />
            Variable Costs (%)
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Dealer Fee</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={dealData.dealerFee || ''}
                  onChange={(e) => handleInputChange('dealerFee', e.target.value)}
                  className="pr-7 text-sm h-9"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(dealerFeeCost)}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Contractor Fee</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={dealData.contractorFee || ''}
                  onChange={(e) => handleInputChange('contractorFee', e.target.value)}
                  className="pr-7 text-sm h-9"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(contractorFeeCost)}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Commission</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={dealData.commission || ''}
                  onChange={(e) => handleInputChange('commission', e.target.value)}
                  className="pr-7 text-sm h-9"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(commissionCost)}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Marketing Fee</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={dealData.marketingFee || ''}
                  onChange={(e) => handleInputChange('marketingFee', e.target.value)}
                  className="pr-7 text-sm h-9"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(marketingFeeCost)}</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Costs:</span>
            <span className="font-semibold text-destructive">{formatCurrency(totalCosts)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Deal Size:</span>
            <span className="font-semibold">{formatCurrency(dealData.dealSize)}</span>
          </div>
          <div className="border-t border-primary/20 my-2" />
          <div className="flex justify-between items-center">
            <span className="font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              Gross Profit:
            </span>
            <span className={`text-xl font-bold ${grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {formatCurrency(grossProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Profit Margin:</span>
            <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProfitCalculatorPage = () => {
  const navigate = useNavigate();
  const [deal1, setDeal1] = useState({ ...defaultDealData });
  const [deal2, setDeal2] = useState({ ...defaultDealData });
  const [deal3, setDeal3] = useState({ ...defaultDealData });

  useEffect(() => {
    const agentId = localStorage.getItem('agentId');
    const allowedAgents = ['MM23', 'WA4929'];
    
    if (!allowedAgents.includes(agentId)) {
      navigate('/home');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Profit Calculator</h1>
            <p className="text-sm text-muted-foreground">Compare deal profitability side by side</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <DealCalculator dealNumber={1} dealData={deal1} setDealData={setDeal1} />
          <DealCalculator dealNumber={2} dealData={deal2} setDealData={setDeal2} />
          <DealCalculator dealNumber={3} dealData={deal3} setDealData={setDeal3} />
        </div>
      </main>
    </div>
  );
};

export default ProfitCalculatorPage;
