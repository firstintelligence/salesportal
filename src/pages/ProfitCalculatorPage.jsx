import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown, TrendingUp, TrendingDown, DollarSign, PieChart, Plus, X, ArrowUpRight } from "lucide-react";
import { generateProfitCalculatorPDF } from "@/utils/profitCalculatorPDFGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// Import product images - brand-specific
import heatPumpImg from "@/assets/product-heat-pump-kinghome.png";
import furnaceImg from "@/assets/product-furnace-lennox.png";
import tanklessImg from "@/assets/product-tankless-navien.png";
import waterHeaterImg from "@/assets/product-water-heater-bradford.png";
import rheemProterraImg from "@/assets/product-rheem-proterra.png";
import insulationImg from "@/assets/product-attic-insulation.png";

// Product images mapping
const productImages = {
  'heat-pump': heatPumpImg,
  'furnace': furnaceImg,
  'tankless': tanklessImg,
  'water-heater': waterHeaterImg,
  'rheem-proterra': rheemProterraImg,
  'insulation': insulationImg,
  'custom': null,
};

const getProductImage = (presetId, category) => {
  if (presetId === 'rheem-proterra') return rheemProterraImg;
  return productImages[category] || null;
};

// Product presets
const productPresets = [
  { id: 'heat-pump-standard', name: 'Heat Pump Standard', category: 'heat-pump', equipmentCost: 4500, laborCost: 2500, salePrice: 12500 },
  { id: 'heat-pump-premium', name: 'Heat Pump Premium', category: 'heat-pump', equipmentCost: 7000, laborCost: 3500, salePrice: 18500 },
  { id: 'furnace-standard', name: 'Furnace Standard', category: 'furnace', equipmentCost: 2200, laborCost: 1800, salePrice: 6500 },
  { id: 'furnace-premium', name: 'Furnace Premium', category: 'furnace', equipmentCost: 3800, laborCost: 2500, salePrice: 9500 },
  { id: 'tankless-standard', name: 'Tankless Water Heater Standard', category: 'tankless', equipmentCost: 2200, laborCost: 1500, salePrice: 5800 },
  { id: 'tankless-premium', name: 'Tankless Water Heater Premium', category: 'tankless', equipmentCost: 3500, laborCost: 2100, salePrice: 8200 },
  { id: 'cv40', name: 'CV40 Water Heater', category: 'water-heater', equipmentCost: 1200, laborCost: 1000, salePrice: 3800 },
  { id: 'cv50', name: 'CV50 Water Heater', category: 'water-heater', equipmentCost: 1400, laborCost: 1100, salePrice: 4100 },
  { id: 'pv40', name: 'PV40 Water Heater', category: 'water-heater', equipmentCost: 1600, laborCost: 1200, salePrice: 4400 },
  { id: 'pv50', name: 'PV50 Water Heater', category: 'water-heater', equipmentCost: 1800, laborCost: 1300, salePrice: 4700 },
  { id: 'rheem-proterra', name: 'Rheem ProTerra Heat Pump', category: 'heat-pump', equipmentCost: 3200, laborCost: 2000, salePrice: 7200 },
  { id: 'attic-insulation-1000', name: 'Attic Insulation (up to 1000 sq ft)', category: 'insulation', equipmentCost: 1500, laborCost: 2000, salePrice: 4500 },
  { id: 'attic-insulation-1000-plus', name: 'Attic Insulation (1000+ sq ft)', category: 'insulation', equipmentCost: 2500, laborCost: 2800, salePrice: 6500 },
  { id: 'custom', name: 'Custom / Manual Entry', category: 'custom', equipmentCost: 0, laborCost: 0, salePrice: 0 },
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

const calculateMetrics = (dealData) => {
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
  
  const fixedCosts = equipmentCost + laborCost + extras;
  const variableCosts = dealerFeeCost + contractorFeeCost + commissionCost + marketingFeeCost;
  const totalCosts = fixedCosts + variableCosts;
  const grossProfit = dealSize - totalCosts;
  const profitMargin = dealSize > 0 ? (grossProfit / dealSize) * 100 : 0;

  return {
    dealSize, equipmentCost, laborCost, extras,
    dealerFeeCost, contractorFeeCost, commissionCost, marketingFeeCost,
    fixedCosts, variableCosts, totalCosts, grossProfit, profitMargin
  };
};

// Color palette matching the design examples
const COLORS = {
  blue: '#4F46E5',
  blueLight: '#818CF8',
  purple: '#7C3AED',
  teal: '#14B8A6',
  green: '#22C55E',
  amber: '#F59E0B',
  pink: '#EC4899',
  red: '#EF4444',
};

const PIE_COLORS = ['#4F46E5', '#14B8A6', '#7C3AED', '#F59E0B', '#EC4899', '#22C55E', '#06B6D4'];

const ProfitCalculatorPage = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([{ ...defaultDealData }]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const agentId = localStorage.getItem('agentId');
    const allowedAgents = ['MM23', 'WA4929'];
    if (!allowedAgents.includes(agentId)) {
      navigate('/landing');
    }
  }, [navigate]);

  const activeDeal = deals[activeIndex];
  const setActiveDeal = (data) => {
    const newDeals = [...deals];
    newDeals[activeIndex] = data;
    setDeals(newDeals);
  };

  const handlePresetChange = (presetId) => {
    const preset = productPresets.find(p => p.id === presetId);
    if (preset) {
      setActiveDeal({
        ...activeDeal,
        productPreset: presetId,
        dealSize: preset.salePrice,
        equipmentCost: preset.equipmentCost,
        laborCost: preset.laborCost,
      });
    }
  };

  const handleInputChange = (field, value) => {
    setActiveDeal({ ...activeDeal, [field]: value });
  };

  const addComparisonProduct = () => {
    if (deals.length < 3) {
      setDeals([...deals, { ...defaultDealData }]);
      setActiveIndex(deals.length);
    }
  };

  const removeProduct = (index) => {
    if (deals.length > 1) {
      const newDeals = deals.filter((_, i) => i !== index);
      setDeals(newDeals);
      setActiveIndex(Math.max(0, activeIndex - 1));
    }
  };

  const metrics = calculateMetrics(activeDeal);
  const selectedPreset = productPresets.find(p => p.id === activeDeal.productPreset);
  const productImage = selectedPreset ? getProductImage(selectedPreset.id, selectedPreset.category) : null;

  const handleGeneratePDF = () => {
    const productName = selectedPreset?.name || 'Custom Deal';
    generateProfitCalculatorPDF(activeDeal, activeIndex + 1, productName);
  };

  // Chart data
  const costBreakdownData = [
    { name: 'Equipment', value: metrics.equipmentCost, color: COLORS.blue },
    { name: 'Labor', value: metrics.laborCost, color: COLORS.teal },
    { name: 'Extras', value: metrics.extras, color: COLORS.purple },
    { name: 'Dealer Fee', value: metrics.dealerFeeCost, color: COLORS.amber },
    { name: 'Contractor', value: metrics.contractorFeeCost, color: COLORS.pink },
    { name: 'Commission', value: metrics.commissionCost, color: COLORS.green },
    { name: 'Marketing', value: metrics.marketingFeeCost, color: '#06B6D4' },
  ].filter(item => item.value > 0);

  const barChartData = [
    { name: 'Equipment', value: metrics.equipmentCost, fill: COLORS.blue },
    { name: 'Labor', value: metrics.laborCost, fill: COLORS.teal },
    { name: 'Dealer', value: metrics.dealerFeeCost, fill: COLORS.amber },
    { name: 'Contractor', value: metrics.contractorFeeCost, fill: COLORS.pink },
    { name: 'Commission', value: metrics.commissionCost, fill: COLORS.green },
    { name: 'Marketing', value: metrics.marketingFeeCost, fill: '#06B6D4' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/landing')}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-slate-800">Profit Calculator</h1>
          <Button
            onClick={handleGeneratePDF}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Product Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {deals.map((deal, index) => {
            const preset = productPresets.find(p => p.id === deal.productPreset);
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeIndex === index
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {preset?.name || `Option ${index + 1}`}
                {deals.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeProduct(index); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>
            );
          })}
          {deals.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addComparisonProduct}
              className="rounded-full gap-1 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4" />
              Compare Product
            </Button>
          )}
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Revenue Card */}
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-xl shadow-indigo-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-indigo-100 text-sm font-medium">Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(metrics.dealSize)}</p>
              <p className="text-indigo-200 text-xs mt-1">Total sale price</p>
            </CardContent>
          </Card>

          {/* Total Costs Card */}
          <Card className="bg-white border border-slate-200 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Total Costs</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.totalCosts)}</p>
              <p className="text-slate-400 text-xs mt-1">Fixed + Variable</p>
            </CardContent>
          </Card>

          {/* Net Profit Card */}
          <Card className={`border-0 shadow-xl ${metrics.grossProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200/50' : 'bg-gradient-to-br from-red-500 to-rose-500 shadow-red-200/50'} text-white`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">Net Profit</span>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  {metrics.grossProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(metrics.grossProfit)}</p>
              <p className="text-white/70 text-xs mt-1">{metrics.profitMargin.toFixed(1)}% margin</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input Form */}
          <div className="space-y-4">
            {/* Product Selection */}
            <Card className="bg-white border border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  {productImage && (
                    <img src={productImage} alt={selectedPreset?.name} className="w-16 h-16 object-contain" />
                  )}
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 font-medium">Select Product</label>
                    <Select value={activeDeal.productPreset} onValueChange={handlePresetChange}>
                      <SelectTrigger className="mt-1 border-slate-200">
                        <SelectValue placeholder="Choose a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {productPresets.map(preset => (
                          <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fixed Costs */}
            <Card className="bg-white border border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  Fixed Costs
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Sale Price', field: 'dealSize', value: activeDeal.dealSize },
                    { label: 'Equipment', field: 'equipmentCost', value: activeDeal.equipmentCost },
                    { label: 'Labor', field: 'laborCost', value: activeDeal.laborCost },
                    { label: 'Extras/Materials', field: 'extras', value: activeDeal.extras },
                  ].map(item => (
                    <div key={item.field} className="flex items-center justify-between gap-3">
                      <label className="text-sm text-slate-600">{item.label}</label>
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <Input
                          type="number"
                          value={item.value || ''}
                          onChange={(e) => handleInputChange(item.field, parseFloat(e.target.value) || 0)}
                          className="pl-6 text-right h-9 border-slate-200"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Variable Costs */}
            <Card className="bg-white border border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  Variable Costs
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Dealer Fee', field: 'dealerFee', value: activeDeal.dealerFee, cost: metrics.dealerFeeCost },
                    { label: 'Contractor', field: 'contractorFee', value: activeDeal.contractorFee, cost: metrics.contractorFeeCost },
                    { label: 'Commission', field: 'commission', value: activeDeal.commission, cost: metrics.commissionCost },
                    { label: 'Marketing', field: 'marketingFee', value: activeDeal.marketingFee, cost: metrics.marketingFeeCost },
                  ].map(item => (
                    <div key={item.field} className="flex items-center justify-between gap-2">
                      <label className="text-sm text-slate-600 flex-1">{item.label}</label>
                      <div className="relative w-16">
                        <Input
                          type="number"
                          value={item.value || ''}
                          onChange={(e) => handleInputChange(item.field, parseFloat(e.target.value) || 0)}
                          className="pr-6 text-right h-8 text-sm border-slate-200"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                      </div>
                      <span className="text-xs text-slate-500 w-16 text-right">{formatCurrency(item.cost)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Charts */}
          <div className="space-y-4">
            {/* Pie Chart - Cost Distribution */}
            <Card className="bg-white border border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">Cost Distribution</h3>
                  <PieChart className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={costBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {costBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {costBreakdownData.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profit Margin Gauge */}
            <Card className="bg-white border border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Profit Margin</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-40 h-20">
                    {/* Semi-circle background */}
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path
                        d="M 5 50 A 45 45 0 0 1 95 50"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 5 50 A 45 45 0 0 1 95 50"
                        fill="none"
                        stroke={metrics.profitMargin >= 20 ? COLORS.green : metrics.profitMargin >= 10 ? COLORS.amber : COLORS.red}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(100, Math.max(0, metrics.profitMargin * 2.8))} 150`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-end justify-center pb-2">
                      <span className={`text-2xl font-bold ${
                        metrics.profitMargin >= 20 ? 'text-green-600' : 
                        metrics.profitMargin >= 10 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {metrics.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    metrics.profitMargin >= 25 ? 'bg-green-100 text-green-700' :
                    metrics.profitMargin >= 15 ? 'bg-blue-100 text-blue-700' :
                    metrics.profitMargin >= 5 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {metrics.profitMargin >= 25 ? 'Excellent' :
                     metrics.profitMargin >= 15 ? 'Good' :
                     metrics.profitMargin >= 5 ? 'Moderate' : 'Low'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Breakdown & Summary */}
          <div className="space-y-4">
            {/* Bar Chart - Cost Breakdown */}
            <Card className="bg-white border border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Cost Breakdown</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={70}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Revenue</span>
                    <span className="font-semibold">{formatCurrency(metrics.dealSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Fixed Costs</span>
                    <span className="text-blue-400">{formatCurrency(metrics.fixedCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Variable Costs</span>
                    <span className="text-amber-400">{formatCurrency(metrics.variableCosts)}</span>
                  </div>
                  <div className="border-t border-slate-700 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Net Profit</span>
                    <span className={`text-xl font-bold ${metrics.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(metrics.grossProfit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate PDF Button */}
            <Button
              onClick={handleGeneratePDF}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200/50 py-6"
            >
              <FileDown className="w-5 h-5 mr-2" />
              Generate PDF Report
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfitCalculatorPage;
