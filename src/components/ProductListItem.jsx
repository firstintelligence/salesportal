import React, { memo, useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { hvacProducts, getProductsByCategory } from '../utils/hvacProducts.js';
import { getSimplifiedProductName } from '../utils/productNameSimplifier.js';

const ProductListItem = memo(({ 
  item, 
  index, 
  isFirst, 
  isLast, 
  isOnly,
  onItemChange, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const productCategories = getProductsByCategory();
  const simplifiedName = getSimplifiedProductName(item.productId, item.name);
  const total = (item.quantity * item.amount).toFixed(2);

  const handleProductSelect = (value) => {
    if (value === 'custom') {
      onItemChange(index, 'productId', 'custom');
      onItemChange(index, 'name', '');
      onItemChange(index, 'description', '');
      onItemChange(index, 'amount', 0);
      setShowDetails(true); // Auto-expand for custom products
    } else {
      const product = hvacProducts.find(p => p.id === value);
      if (product) {
        onItemChange(index, 'productId', value);
        onItemChange(index, 'name', product.name);
        onItemChange(index, 'description', product.description);
        onItemChange(index, 'amount', product.basePrice);
      }
    }
  };

  return (
    <div className={`bg-white md:border md:border-slate-200 md:rounded-lg md:p-3 md:shadow-sm ${showDetails ? 'mb-3' : ''}`}>
      {/* Mobile: Product on left half, qty+price+arrow on right half | Desktop: Single row */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Product selector - takes half width on mobile, flex on desktop */}
        <div className="w-1/2 md:w-auto md:flex-1 min-w-0">
          <Select 
            value={item.productId || ''} 
            onValueChange={handleProductSelect}
          >
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs md:text-sm w-full">
              <SelectValue placeholder="Product..." />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50 max-h-[300px] w-[calc(100vw-2rem)] md:w-[var(--radix-select-trigger-width)] md:min-w-[400px]">
              <SelectItem value="custom" className="font-medium text-primary pl-8">
                + Custom Product
              </SelectItem>
              {Object.entries(productCategories).map(([category, products]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                    {category}
                  </div>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id} className="pl-8">
                      <span className="truncate text-xs">{product.name}</span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right half on mobile: Qty + Price + Arrow */}
        <div className="w-1/2 md:w-auto md:flex-1 flex items-center gap-1.5 md:gap-2">
        {/* Quantity - compact, no spinners */}
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
            className="h-10 w-8 md:w-16 text-center text-[10px] md:text-sm bg-slate-50 border-slate-200 px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0"
          />

          {/* Price - takes remaining space on mobile */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] md:text-xs">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.amount === 0 ? '' : item.amount}
              onChange={(e) => onItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
              onFocus={(e) => { if (item.amount === 0) e.target.value = ''; }}
              onBlur={(e) => { if (e.target.value === '') onItemChange(index, 'amount', 0); }}
              placeholder="0"
              className="h-10 pl-4 pr-1 text-[10px] md:text-sm bg-slate-50 border-slate-200"
            />
          </div>

          {/* Total display - hidden on mobile, shown on md+ */}
          <div className="hidden md:flex w-24 h-10 items-center justify-end px-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 shrink-0">
            ${parseFloat(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Details toggle - smaller on mobile */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-7 md:h-8 md:w-8 p-0 text-muted-foreground hover:text-foreground bg-slate-100 md:bg-transparent rounded-lg shrink-0"
            onClick={() => setShowDetails(!showDetails)}
            title="Edit details"
          >
            {showDetails ? <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />}
          </Button>
        </div>
        
        {/* Delete button - only shown on desktop inline, on mobile it's in expanded section */}
        {!isOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden md:flex h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expandable details section */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Input
                type="text"
                value={item.name || ''}
                onChange={(e) => onItemChange(index, 'name', e.target.value)}
                placeholder=" "
                className="h-10 text-xs md:text-sm bg-white border-slate-200 pt-4 peer"
                id={`item-name-${index}`}
              />
              <label 
                htmlFor={`item-name-${index}`}
                className="absolute left-3 top-1 text-[10px] font-medium text-slate-500 pointer-events-none"
              >
                Item Name
              </label>
            </div>
            <div className="relative">
              <Input
                type="text"
                value={item.description || ''}
                onChange={(e) => onItemChange(index, 'description', e.target.value)}
                placeholder=" "
                className="h-10 text-xs md:text-sm bg-white border-slate-200 pt-4 peer"
                id={`item-desc-${index}`}
              />
              <label 
                htmlFor={`item-desc-${index}`}
                className="absolute left-3 top-1 text-[10px] font-medium text-slate-500 pointer-events-none"
              >
                Description
              </label>
            </div>
          </div>
          
          {/* Delete button inside expanded section on mobile */}
          {!isOnly && (
            <div className="md:hidden flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Item
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ProductListItem.displayName = 'ProductListItem';

export default ProductListItem;