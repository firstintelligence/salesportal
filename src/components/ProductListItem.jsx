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
    <div className="bg-white md:border md:border-slate-200 md:rounded-lg md:p-3 md:shadow-sm">
      {/* Mobile: Stack layout, Desktop: Single row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
        {/* Product selector - full width on mobile */}
        <div className="w-full md:flex-1 md:min-w-0">
          <Select 
            value={item.productId || ''} 
            onValueChange={handleProductSelect}
          >
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs md:text-sm w-full">
              <SelectValue placeholder="Select product..." />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50 max-h-[300px]">
              <SelectItem value="custom" className="font-medium text-primary">
                + Custom Product
              </SelectItem>
              {Object.entries(productCategories).map(([category, products]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0">
                    {category}
                  </div>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id} className="pl-4">
                      <span className="flex items-center justify-between w-full gap-4">
                        <span className="truncate">{product.name}</span>
                        <span className="text-sm text-slate-500 font-medium">
                          ${product.basePrice.toLocaleString()}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Second row on mobile: Qty, Price, Actions */}
        <div className="flex items-center gap-2">
          {/* Quantity */}
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
            className="h-10 w-12 md:w-16 text-center text-xs md:text-sm bg-slate-50 border-slate-200"
          />

          {/* Price - editable */}
          <div className="relative flex-1 md:w-24 md:flex-none">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs md:text-sm">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.amount}
              onChange={(e) => onItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
              className="h-10 pl-5 text-xs md:text-sm bg-slate-50 border-slate-200"
            />
          </div>

          {/* Total display - hidden on mobile, shown on md+ */}
          <div className="hidden md:flex w-24 h-10 items-center justify-end px-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 shrink-0">
            ${parseFloat(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Actions - larger on mobile/tablet */}
          <div className="flex items-center gap-1 md:gap-0.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 md:h-8 md:w-8 p-0 text-muted-foreground hover:text-foreground bg-slate-100 md:bg-transparent rounded-lg"
              onClick={() => setShowDetails(!showDetails)}
              title="Edit details"
            >
              {showDetails ? <ChevronUp className="h-5 w-5 md:h-4 md:w-4" /> : <ChevronDown className="h-5 w-5 md:h-4 md:w-4" />}
            </Button>
            {!isOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 md:h-8 md:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 bg-red-50 md:bg-transparent rounded-lg"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable details section */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Item Name</label>
            <Input
              type="text"
              value={item.name || ''}
              onChange={(e) => onItemChange(index, 'name', e.target.value)}
              placeholder="Enter item name..."
              className="h-9 text-xs md:text-sm bg-slate-50 border-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <Input
              type="text"
              value={item.description || ''}
              onChange={(e) => onItemChange(index, 'description', e.target.value)}
              placeholder="Enter description..."
              className="h-9 text-xs md:text-sm bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
});

ProductListItem.displayName = 'ProductListItem';

export default ProductListItem;