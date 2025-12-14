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
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
      {/* Compact main row */}
      <div className="flex items-center gap-2">
        {/* Product selector - takes most space */}
        <div className="flex-1 min-w-0">
          <Select 
            value={item.productId || ''} 
            onValueChange={handleProductSelect}
          >
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-sm">
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

        {/* Quantity */}
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
          className="h-10 w-16 text-center text-sm bg-slate-50 border-slate-200"
        />

        {/* Price */}
        <div className="relative w-24">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.amount}
            onChange={(e) => onItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
            className="h-10 pl-5 text-sm bg-slate-50 border-slate-200"
          />
        </div>

        {/* Total display */}
        <div className="w-24 h-10 flex items-center justify-end px-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-semibold text-slate-700">
          ${parseFloat(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setShowDetails(!showDetails)}
            title="Edit details"
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {!isOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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
              className="h-9 text-sm bg-slate-50 border-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <Input
              type="text"
              value={item.description || ''}
              onChange={(e) => onItemChange(index, 'description', e.target.value)}
              placeholder="Enter description..."
              className="h-9 text-sm bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
});

ProductListItem.displayName = 'ProductListItem';

export default ProductListItem;
