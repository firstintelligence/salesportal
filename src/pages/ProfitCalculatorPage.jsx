import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, TrendingUp, FileDown } from "lucide-react";
import { generateProfitCalculatorPDF } from "@/utils/profitCalculatorPDFGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import product images - brand-specific
import heatPumpImg from "@/assets/product-heat-pump-trane.png";
import furnaceImg from "@/assets/product-furnace-lennox.png";
import tanklessImg from "@/assets/product-tankless-navien.png";
import waterHeaterImg from "@/assets/product-water-heater-bradford.png";
import rheemProterraImg from "@/assets/product-rheem-proterra.png";
import insulationImg from "@/assets/product-attic-insulation.png";

// Product images mapping with specific product overrides
const productImages = {
  'heat-pump': heatPumpImg,
  'furnace': furnaceImg,
  'tankless': tanklessImg,
  'water-heater': waterHeaterImg,
  'rheem-proterra': rheemProterraImg,
  'insulation': insulationImg,
  'custom': null,
};

// Function to get product image based on preset id and category
const getProductImage = (presetId, category) => {
  // Check for specific product overrides first
  if (presetId === 'rheem-proterra') {
    return rheemProterraImg;
  }
  // Fall back to category-based image
  return productImages[category] || null;
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Mobile comparison row - shared label with two input values
const ComparisonRow = ({ label, deal1Value, deal2Value, onDeal1Change, onDeal2Change, prefix, isPercent }) => (
  <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
    <span className="text-[11px] text-muted-foreground truncate">{label}</span>
    <div className="relative">
      {prefix && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">{prefix}</span>}
      <Input
        type="number"
        value={deal1Value === 0 ? '' : (deal1Value || '')}
        onChange={(e) => onDeal1Change(parseFloat(e.target.value) || 0)}
        className={`${prefix ? 'pl-4' : ''} ${isPercent ? 'pr-5' : ''} text-xs h-7 text-right`}
        placeholder="0"
      />
      {isPercent && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">%</span>}
    </div>
    <div className="relative">
      {prefix && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">{prefix}</span>}
      <Input
        type="number"
        value={deal2Value === 0 ? '' : (deal2Value || '')}
        onChange={(e) => onDeal2Change(parseFloat(e.target.value) || 0)}
        className={`${prefix ? 'pl-4' : ''} ${isPercent ? 'pr-5' : ''} text-xs h-7 text-right`}
        placeholder="0"
      />
      {isPercent && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">%</span>}
    </div>
  </div>
);

const calculateDealMetrics = (dealData) => {
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
  const grossProfit = dealSize - totalCosts;
  const profitMargin = dealSize > 0 ? (grossProfit / dealSize) * 100 : 0;

  return { dealSize, totalCosts, grossProfit, profitMargin };
};

// Mobile comparison component
const MobileComparison = ({ deal1, setDeal1, deal2, setDeal2 }) => {
  const handlePresetChange = (presetId, setDealData, dealData) => {
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

  const metrics1 = calculateDealMetrics(deal1);
  const metrics2 = calculateDealMetrics(deal2);

  const preset1 = productPresets.find(p => p.id === deal1.productPreset);
  const preset2 = productPresets.find(p => p.id === deal2.productPreset);
  const image1 = preset1 ? getProductImage(preset1.id, preset1.category) : null;
  const image2 = preset2 ? getProductImage(preset2.id, preset2.category) : null;

  return (
    <Card className="md:hidden">
      <CardContent className="p-3 space-y-3">
        {/* Headers */}
        <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
          <span className="text-xs font-semibold text-muted-foreground"></span>
          <span className="text-xs font-bold text-center text-primary">Option 1</span>
          <span className="text-xs font-bold text-center text-primary">Option 2</span>
        </div>

        {/* Product Selectors */}
        <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
          <span className="text-[11px] text-muted-foreground">Product</span>
          <Select value={deal1.productPreset} onValueChange={(v) => handlePresetChange(v, setDeal1, deal1)}>
            <SelectTrigger className="h-7 text-[10px] px-2">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {productPresets.map(preset => (
                <SelectItem key={preset.id} value={preset.id} className="text-xs">
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deal2.productPreset} onValueChange={(v) => handlePresetChange(v, setDeal2, deal2)}>
            <SelectTrigger className="h-7 text-[10px] px-2">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {productPresets.map(preset => (
                <SelectItem key={preset.id} value={preset.id} className="text-xs">
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Images */}
        {(image1 || image2) && (
          <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
            <span></span>
            <div className="flex justify-center">
              {image1 ? (
                <img src={image1} alt={preset1?.name || 'Product'} className="w-14 h-14 object-contain" />
              ) : <div className="w-14 h-14" />}
            </div>
            <div className="flex justify-center">
              {image2 ? (
                <img src={image2} alt={preset2?.name || 'Product'} className="w-14 h-14 object-contain" />
              ) : <div className="w-14 h-14" />}
            </div>
          </div>
        )}
                </div>
              ) : <div className="w-14 h-14" />}
            </div>
          </div>
        )}

        {/* Fixed Costs */}
        <div className="space-y-1.5 p-2 bg-muted/50 rounded-lg">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fixed Costs</p>
          <ComparisonRow label="Deal Size" deal1Value={deal1.dealSize} deal2Value={deal2.dealSize} onDeal1Change={(v) => setDeal1({...deal1, dealSize: v})} onDeal2Change={(v) => setDeal2({...deal2, dealSize: v})} prefix="$" />
          <ComparisonRow label="Equipment" deal1Value={deal1.equipmentCost} deal2Value={deal2.equipmentCost} onDeal1Change={(v) => setDeal1({...deal1, equipmentCost: v})} onDeal2Change={(v) => setDeal2({...deal2, equipmentCost: v})} prefix="$" />
          <ComparisonRow label="Labor" deal1Value={deal1.laborCost} deal2Value={deal2.laborCost} onDeal1Change={(v) => setDeal1({...deal1, laborCost: v})} onDeal2Change={(v) => setDeal2({...deal2, laborCost: v})} prefix="$" />
          <ComparisonRow label="Extras" deal1Value={deal1.extras} deal2Value={deal2.extras} onDeal1Change={(v) => setDeal1({...deal1, extras: v})} onDeal2Change={(v) => setDeal2({...deal2, extras: v})} prefix="$" />
        </div>

        {/* Variable Costs */}
        <div className="space-y-1.5 p-2 bg-muted/50 rounded-lg">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Variable Costs</p>
          <ComparisonRow label="Dealer Fee" deal1Value={deal1.dealerFee} deal2Value={deal2.dealerFee} onDeal1Change={(v) => setDeal1({...deal1, dealerFee: v})} onDeal2Change={(v) => setDeal2({...deal2, dealerFee: v})} isPercent />
          <ComparisonRow label="Contractor" deal1Value={deal1.contractorFee} deal2Value={deal2.contractorFee} onDeal1Change={(v) => setDeal1({...deal1, contractorFee: v})} onDeal2Change={(v) => setDeal2({...deal2, contractorFee: v})} isPercent />
          <ComparisonRow label="Commission" deal1Value={deal1.commission} deal2Value={deal2.commission} onDeal1Change={(v) => setDeal1({...deal1, commission: v})} onDeal2Change={(v) => setDeal2({...deal2, commission: v})} isPercent />
          <ComparisonRow label="Marketing" deal1Value={deal1.marketingFee} deal2Value={deal2.marketingFee} onDeal1Change={(v) => setDeal1({...deal1, marketingFee: v})} onDeal2Change={(v) => setDeal2({...deal2, marketingFee: v})} isPercent />
        </div>

        {/* Results */}
        <div className="space-y-1.5 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
            <span className="text-[11px] text-muted-foreground">Total Costs</span>
            <span className="text-xs font-medium text-destructive text-center">{formatCurrency(metrics1.totalCosts)}</span>
            <span className="text-xs font-medium text-destructive text-center">{formatCurrency(metrics2.totalCosts)}</span>
          </div>
          <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
            <span className="text-[11px] text-muted-foreground">Revenue</span>
            <span className="text-xs font-medium text-center">{formatCurrency(metrics1.dealSize)}</span>
            <span className="text-xs font-medium text-center">{formatCurrency(metrics2.dealSize)}</span>
          </div>
          <div className="border-t border-primary/20 my-1.5" />
          <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
            <span className="text-[11px] font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              Profit
            </span>
            <span className={`text-sm font-bold text-center ${metrics1.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {formatCurrency(metrics1.grossProfit)}
            </span>
            <span className={`text-sm font-bold text-center ${metrics2.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {formatCurrency(metrics2.grossProfit)}
            </span>
          </div>
          <div className="grid grid-cols-[1fr,1fr,1fr] gap-1.5 items-center">
            <span className="text-[11px] text-muted-foreground">Margin</span>
            <span className={`text-xs font-semibold text-center ${metrics1.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {metrics1.profitMargin.toFixed(1)}%
            </span>
            <span className={`text-xs font-semibold text-center ${metrics2.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {metrics2.profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

const DealCalculator = ({ dealNumber, dealData, setDealData, productPresets }) => {
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
  const productImage = selectedPreset ? getProductImage(selectedPreset.id, selectedPreset.category) : null;

  const handleGeneratePDF = () => {
    const productName = selectedPreset?.name || 'Custom Deal';
    generateProfitCalculatorPDF(dealData, dealNumber, productName);
  };

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
            <img 
              src={productImage} 
              alt={selectedPreset?.name || 'Product'} 
              className="w-24 h-24 object-contain"
            />
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

        {/* Generate PDF Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleGeneratePDF}
          className="w-full flex items-center justify-center gap-2 text-primary hover:bg-primary/10"
        >
          <FileDown className="w-4 h-4" />
          Generate PDF Report
        </Button>
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
      navigate('/landing');
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
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4">
        {/* Mobile View - Side by side comparison */}
        <MobileComparison 
          deal1={deal1} 
          setDeal1={setDeal1} 
          deal2={deal2} 
          setDeal2={setDeal2} 
        />
        
        {/* Desktop View - 3 cards */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <DealCalculator dealNumber={1} dealData={deal1} setDealData={setDeal1} productPresets={productPresets} />
          <DealCalculator dealNumber={2} dealData={deal2} setDealData={setDeal2} productPresets={productPresets} />
          <DealCalculator dealNumber={3} dealData={deal3} setDealData={setDeal3} productPresets={productPresets} />
        </div>
      </main>
    </div>
  );
};

export default ProfitCalculatorPage;
