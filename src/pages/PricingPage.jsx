import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronRight, DollarSign, Tag, TrendingUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { hvacProducts, getProductsByCategory } from "@/utils/hvacProducts";
import { productPricing, categoryImages, categoryColors } from "@/utils/productPricing";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const PricingPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('categories'); // categories | category | product
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) navigate("/");
  }, [navigate]);

  const categories = getProductsByCategory();
  const categoryOrder = [
    'Heat Pumps', 'Ductless Heat Pumps', 'Furnaces', 'Boilers',
    'Air Conditioning', 'Water Heating', 'Energy Efficiency',
    'Energy Storage', 'Water Filtration', 'Air Filtration', 'Electrical', 'Services'
  ];

  const allProducts = hvacProducts.map(p => ({
    ...p,
    pricing: productPricing[p.id] || { cost: 0, min: 0, max: p.basePrice },
  }));

  const filteredProducts = search
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setView('category');
    setSearch('');
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setView('product');
  };

  const handleBack = () => {
    if (view === 'product') {
      if (search) {
        setView('categories');
        setSelectedProduct(null);
      } else {
        setView('category');
        setSelectedProduct(null);
      }
    } else if (view === 'category') {
      setView('categories');
      setSelectedCategory(null);
    } else {
      navigate('/dashboard');
    }
  };

  // Product detail view
  if (view === 'product' && selectedProduct) {
    const p = selectedProduct;
    const pricing = productPricing[p.id] || { cost: 0, min: 0, max: p.basePrice };
    const colors = categoryColors[p.category] || categoryColors['Services'];
    const margin = pricing.max - pricing.cost;
    const marginPct = pricing.cost > 0 ? ((margin / pricing.cost) * 100).toFixed(0) : 0;

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-base font-semibold text-slate-800 truncate">{p.name}</h1>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6">
          {/* Hero image */}
          <div className="rounded-2xl overflow-hidden mb-6 aspect-video bg-slate-200">
            <img src={categoryImages[p.category]} alt={p.category} className="w-full h-full object-cover" />
          </div>

          <Badge className={`${colors.bg} ${colors.text} border-0 mb-3`}>{p.category}</Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{p.name}</h2>
          <p className="text-sm text-slate-500 mb-6 whitespace-pre-line">{p.description}</p>

          {/* Pricing cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Cost</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(pricing.cost)}</p>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-2">
                <Tag className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] uppercase font-semibold text-amber-500 tracking-wider mb-1">Min</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(pricing.min)}</p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-[10px] uppercase font-semibold text-green-500 tracking-wider mb-1">Max</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(pricing.max)}</p>
            </div>
          </div>

          {/* Margin info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Margin Analysis</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Max Margin</p>
                <p className="font-semibold text-slate-800">{formatCurrency(margin)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Markup</p>
                <p className="font-semibold text-slate-800">{marginPct}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Min Margin</p>
                <p className="font-semibold text-slate-800">{formatCurrency(pricing.min - pricing.cost)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Spread</p>
                <p className="font-semibold text-slate-800">{formatCurrency(pricing.max - pricing.min)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category detail view
  if (view === 'category' && selectedCategory) {
    const products = categories[selectedCategory] || [];
    const colors = categoryColors[selectedCategory] || categoryColors['Services'];

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-base font-semibold text-slate-800">{selectedCategory}</h1>
            <Badge variant="secondary" className="ml-auto">{products.length} products</Badge>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4">
          {/* Category hero */}
          <div className="rounded-2xl overflow-hidden mb-5 h-36 sm:h-48 relative">
            <img src={categoryImages[selectedCategory]} alt={selectedCategory} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${colors.gradient} opacity-40`} />
            <div className="absolute bottom-3 left-4">
              <h2 className="text-white font-bold text-lg sm:text-xl drop-shadow-lg">{selectedCategory}</h2>
            </div>
          </div>

          {/* Product list */}
          <div className="space-y-2">
            {products.map(p => {
              const pricing = productPricing[p.id] || { cost: 0, min: 0, max: p.basePrice };
              return (
                <div
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3 cursor-pointer hover:border-slate-300 hover:shadow-sm active:scale-[0.99] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-slate-400">Cost <span className="font-semibold text-slate-600">{formatCurrency(pricing.cost)}</span></span>
                      <span className="text-[11px] text-amber-500">Min <span className="font-semibold text-amber-700">{formatCurrency(pricing.min)}</span></span>
                      <span className="text-[11px] text-green-500">Max <span className="font-semibold text-green-700">{formatCurrency(pricing.max)}</span></span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Main categories view
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-semibold text-slate-800">Pricing</h1>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4">
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9"
          />
        </div>

        {/* Search results */}
        {search ? (
          <div className="space-y-2">
            {filteredProducts.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No products found</p>
            )}
            {filteredProducts.map(p => {
              const colors = categoryColors[p.category] || categoryColors['Services'];
              return (
                <div
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3 cursor-pointer hover:border-slate-300 hover:shadow-sm active:scale-[0.99] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    <Badge variant="outline" className={`${colors.bg} ${colors.text} border-0 text-[10px] mt-1`}>{p.category}</Badge>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-slate-400">Cost <span className="font-semibold text-slate-600">{formatCurrency(p.pricing.cost)}</span></span>
                      <span className="text-[11px] text-amber-500">Min <span className="font-semibold text-amber-700">{formatCurrency(p.pricing.min)}</span></span>
                      <span className="text-[11px] text-green-500">Max <span className="font-semibold text-green-700">{formatCurrency(p.pricing.max)}</span></span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          /* Category grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categoryOrder.filter(c => categories[c]).map(cat => {
              const products = categories[cat];
              const colors = categoryColors[cat] || categoryColors['Services'];
              const priceRange = products.reduce((acc, p) => {
                const pr = productPricing[p.id];
                if (pr) {
                  acc.min = Math.min(acc.min, pr.min);
                  acc.max = Math.max(acc.max, pr.max);
                }
                return acc;
              }, { min: Infinity, max: 0 });

              return (
                <div
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className="group cursor-pointer bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden active:scale-[0.98]"
                >
                  <div className="h-28 sm:h-36 relative overflow-hidden">
                    <img
                      src={categoryImages[cat]}
                      alt={cat}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent`} />
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <h3 className="text-white font-semibold text-sm leading-tight drop-shadow-lg">{cat}</h3>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-white/90 text-slate-700 text-[10px] border-0">
                      {products.length}
                    </Badge>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">
                      {priceRange.min < Infinity ? `${formatCurrency(priceRange.min)} – ${formatCurrency(priceRange.max)}` : 'View pricing'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
