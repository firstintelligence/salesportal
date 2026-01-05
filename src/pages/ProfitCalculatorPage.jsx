import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import product images
import heatPumpImg from "@/assets/product-heat-pump.png";
import furnaceImg from "@/assets/product-furnace.png";
import tanklessImg from "@/assets/product-tankless.png";
import waterHeaterImg from "@/assets/product-water-heater.png";
import insulationImg from "@/assets/product-insulation.png";

// Product images mapping
const productImages = {
  'heat-pump': heatPumpImg,
  'furnace': furnaceImg,
  'tankless': tanklessImg,
  'water-heater': waterHeaterImg,
  'insulation': insulationImg,
  'custom': null,
};

// Product presets with cost breakdowns and image categories
const productPresets = [
  {
    id: 'heat-pump-standard',
    name: 'Heat Pump Standard',
    category: 'heat-pump',
    equipmentCost: 4500,
    laborCost: 2500,
    salePrice: 12500,
  },
  {
    id: 'heat-pump-premium',
    name: 'Heat Pump Premium',
    category: 'heat-pump',
    equipmentCost: 7000,
    laborCost: 3500,
    salePrice: 18500,
  },
  {
    id: 'furnace-standard',
    name: 'Furnace Standard',
    category: 'furnace',
    equipmentCost: 2200,
    laborCost: 1800,
    salePrice: 6500,
  },
  {
    id: 'furnace-premium',
    name: 'Furnace Premium',
    category: 'furnace',
    equipmentCost: 3800,
    laborCost: 2500,
    salePrice: 9500,
  },
  {
    id: 'tankless-standard',
    name: 'Tankless Water Heater Standard',
    category: 'tankless',
    equipmentCost: 2200,
    laborCost: 1500,
    salePrice: 5800,
  },
  {
    id: 'tankless-premium',
    name: 'Tankless Water Heater Premium',
    category: 'tankless',
    equipmentCost: 3500,
    laborCost: 2100,
    salePrice: 8200,
  },
  {
    id: 'cv40',
    name: 'CV40 Water Heater',
    category: 'water-heater',
    equipmentCost: 1200,
    laborCost: 1000,
    salePrice: 3800,
  },
  {
    id: 'cv50',
    name: 'CV50 Water Heater',
    category: 'water-heater',
    equipmentCost: 1400,
    laborCost: 1100,
    salePrice: 4100,
  },
  {
    id: 'pv40',
    name: 'PV40 Water Heater',
    category: 'water-heater',
    equipmentCost: 1600,
    laborCost: 1200,
    salePrice: 4400,
  },
  {
    id: 'pv50',
    name: 'PV50 Water Heater',
    category: 'water-heater',
    equipmentCost: 1800,
    laborCost: 1300,
    salePrice: 4700,
  },
  {
    id: 'rheem-proterra',
    name: 'Rheem ProTerra Heat Pump',
    category: 'heat-pump',
    equipmentCost: 3200,
    laborCost: 2000,
    salePrice: 7200,
  },
  {
    id: 'attic-insulation-1000',
    name: 'Attic Insulation (up to 1000 sq ft)',
    category: 'insulation',
    equipmentCost: 1500,
    laborCost: 2000,
    salePrice: 4500,
  },
  {
    id: 'attic-insulation-1000-plus',
    name: 'Attic Insulation (1000+ sq ft)',
    category: 'insulation',
    equipmentCost: 2500,
    laborCost: 2800,
    salePrice: 6500,
  },
  {
    id: 'custom',
    name: 'Custom / Manual Entry',
    category: 'custom',
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
  extras: 0,
  dealerFee: 8,
  contractorFee: 15,
  commission: 10,
  marketingFee: 15,
};

// Helper to safely get numeric value
const safeNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const CompactField = ({ label, value, onChange, prefix, suffix, small }) => (
  <div className="flex items-center justify-between gap-2">
    <span className={`text-muted-foreground shrink-0 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
    <div className="relative w-28">
      {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{prefix}</span>}
      <Input
        type="number"
        value={value === 0 ? '' : (value || '')}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? 0 : (parseFloat(val) || 0));
        }}
        className={`${prefix ? 'pl-5' : ''} ${suffix ? 'pr-6' : ''} text-sm h-8 text-right`}
        placeholder="0"
      />
      {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{suffix}</span>}
    </div>
  </div>
);

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
    setDealData({ ...dealData, [field]: value });
  };

  const selectedPreset = productPresets.find(p => p.id === dealData.productPreset);
  const productImage = selectedPreset ? productImages[selectedPreset.category] : null;

  // Calculate costs with safe number conversion
  const dealSize = safeNumber(dealData.dealSize);
  const equipmentCost = safeNumber(dealData.equipmentCost);
  const laborCost = safeNumber(dealData.laborCost);
  const extras = safeNumber(dealData.extras);
  const dealerFee = safeNumber(dealData.dealerFee);
  const contractorFee = safeNumber(dealData.contractorFee);
  const commission = safeNumber(dealData.commission);
  const marketingFee = safeNumber(dealData.marketingFee);

  const dealerFeeCost = (dealSize * dealerFee) / 100;
  const amountAfterDealerFee = dealSize - dealerFeeCost;
  const contractorFeeCost = (amountAfterDealerFee * contractorFee) / 100;
  const commissionCost = (amountAfterDealerFee * commission) / 100;
  const marketingFeeCost = (amountAfterDealerFee * marketingFee) / 100;
  
  const totalCosts = equipmentCost + laborCost + extras + dealerFeeCost + contractorFeeCost + commissionCost + marketingFeeCost;
  const costsBeforeCommission = equipmentCost + laborCost + extras + dealerFeeCost + contractorFeeCost + marketingFeeCost;
  
  const grossProfit = dealSize - totalCosts;
  const profitBeforeCommission = dealSize - costsBeforeCommission;
  const profitMargin = dealSize > 0 ? (grossProfit / dealSize) * 100 : 0;
  const marginBeforeCommission = dealSize > 0 ? (profitBeforeCommission / dealSize) * 100 : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="w-4 h-4 text-primary" />
          Option {dealNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3">
        {/* Product Preset Selector */}
        <Select value={dealData.productPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select product..." />
          </SelectTrigger>
          <SelectContent>
            {productPresets.map(preset => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Product Image */}
        {productImage && (
          <div className="flex justify-center py-2">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-border/50">
              <img 
                src={productImage} 
                alt={selectedPreset?.name || 'Product'} 
                className="w-full h-full object-contain p-1"
              />
            </div>
          </div>
        )}

        {/* Fixed Costs Section */}
        <div className="space-y-1.5 p-2 bg-muted/50 rounded-lg">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fixed Costs</p>
          <CompactField label="Deal Size" value={dealData.dealSize} onChange={(v) => handleInputChange('dealSize', v)} prefix="$" />
          <CompactField label="Equipment" value={dealData.equipmentCost} onChange={(v) => handleInputChange('equipmentCost', v)} prefix="$" />
          <CompactField label="Labor" value={dealData.laborCost} onChange={(v) => handleInputChange('laborCost', v)} prefix="$" />
          <CompactField label="Extras" value={dealData.extras} onChange={(v) => handleInputChange('extras', v)} prefix="$" />
        </div>

        {/* Variable Costs Section */}
        <div className="space-y-1.5 p-2 bg-muted/50 rounded-lg">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Variable Costs</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Dealer Fee</span>
            <div className="flex items-center gap-1.5">
              <div className="relative w-20">
                <Input
                  type="number"
                  value={dealData.dealerFee || ''}
                  onChange={(e) => handleInputChange('dealerFee', parseFloat(e.target.value) || 0)}
                  className="pr-6 text-sm h-7 text-right"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{formatCurrency(dealerFeeCost)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Contractor</span>
            <div className="flex items-center gap-1.5">
              <div className="relative w-20">
                <Input
                  type="number"
                  value={dealData.contractorFee || ''}
                  onChange={(e) => handleInputChange('contractorFee', parseFloat(e.target.value) || 0)}
                  className="pr-6 text-sm h-7 text-right"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{formatCurrency(contractorFeeCost)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Commission</span>
            <div className="flex items-center gap-1.5">
              <div className="relative w-20">
                <Input
                  type="number"
                  value={dealData.commission || ''}
                  onChange={(e) => handleInputChange('commission', parseFloat(e.target.value) || 0)}
                  className="pr-6 text-sm h-7 text-right"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{formatCurrency(commissionCost)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Marketing</span>
            <div className="flex items-center gap-1.5">
              <div className="relative w-20">
                <Input
                  type="number"
                  value={dealData.marketingFee || ''}
                  onChange={(e) => handleInputChange('marketingFee', parseFloat(e.target.value) || 0)}
                  className="pr-6 text-sm h-7 text-right"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{formatCurrency(marketingFeeCost)}</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-1 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Costs</span>
            <span className="font-medium text-destructive">{formatCurrency(totalCosts)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-medium">{formatCurrency(dealSize)}</span>
          </div>
          <div className="border-t border-primary/20 my-1.5" />
          <div className="flex justify-between items-center">
            <span className="font-medium flex items-center gap-1 text-sm">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Profit
            </span>
            <span className={`text-lg font-bold ${grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {formatCurrency(grossProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Margin</span>
            <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Margin (before comm.)</span>
            <span className={`font-semibold ${marginBeforeCommission >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
              {marginBeforeCommission.toFixed(1)}%
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/landing')}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            Profit Calculator
          </h1>
          <div className="w-8 md:w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <DealCalculator dealNumber={1} dealData={deal1} setDealData={setDeal1} />
          <DealCalculator dealNumber={2} dealData={deal2} setDealData={setDeal2} />
          <DealCalculator dealNumber={3} dealData={deal3} setDealData={setDeal3} />
        </div>
      </main>
    </div>
  );
};

export default ProfitCalculatorPage;
