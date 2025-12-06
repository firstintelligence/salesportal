import React, { memo } from 'react';
import { GripVertical, Trash2, ChevronUp, ChevronDown, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const productCategories = getProductsByCategory();
  const simplifiedName = getSimplifiedProductName(item.productId, item.name);
  const total = (item.quantity * item.amount).toFixed(2);

  const handleProductSelect = (value) => {
    if (value === 'custom') {
      onItemChange(index, 'productId', 'custom');
      onItemChange(index, 'name', '');
      onItemChange(index, 'description', '');
      onItemChange(index, 'amount', 0);
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
    <Card className="p-4 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with product badge and controls */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Item {index + 1}
            </span>
            {item.productId && item.productId !== 'custom' && (
              <span className="ml-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {simplifiedName}
              </span>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1">
          {!isOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onMoveUp(index)}
                disabled={isFirst}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onMoveDown(index)}
                disabled={isLast}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
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

      {/* Product Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Product
        </label>
        <Select 
          value={item.productId || ''} 
          onValueChange={handleProductSelect}
        >
          <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:bg-white">
            <SelectValue placeholder="Select a product..." />
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

      {/* Quantity, Amount, Total Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Qty</label>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
            className="h-11 bg-slate-50 border-slate-200 text-center font-medium"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.amount}
              onChange={(e) => onItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
              className="h-11 bg-slate-50 border-slate-200 pl-7 font-medium"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Total</label>
          <div className="h-11 flex items-center justify-end px-3 bg-slate-100 border border-slate-200 rounded-md font-semibold text-slate-700">
            ${parseFloat(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Item Name (editable) */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name</label>
        <Input
          type="text"
          value={item.name || ''}
          onChange={(e) => onItemChange(index, 'name', e.target.value)}
          placeholder="Enter item name..."
          className="h-11 bg-slate-50 border-slate-200"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <Textarea
          value={item.description || ''}
          onChange={(e) => onItemChange(index, 'description', e.target.value)}
          placeholder="Enter item description..."
          rows={2}
          className="bg-slate-50 border-slate-200 resize-none"
        />
      </div>
    </Card>
  );
});

ProductListItem.displayName = 'ProductListItem';

export default ProductListItem;
