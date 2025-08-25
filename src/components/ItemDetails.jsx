import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hvacProducts, getProductsByCategory } from '../utils/hvacProducts.js';

const ItemDetails = ({ items, handleItemChange, addItem, removeItem, moveItemUp, moveItemDown }) => {
  const productCategories = getProductsByCategory();

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4">Item Details</h2>
      {items.map((item, index) => (
        <div key={index} className="mb-4 relative">
          {/* Move buttons - Desktop */}
          {items.length > 1 && (
            <div className="hidden md:flex absolute -left-12 top-[30px] flex-col gap-1 z-10">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => moveItemUp(index)}
                disabled={index === 0}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => moveItemDown(index)}
                disabled={index === items.length - 1}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-10 gap-4 mb-2 items-end relative">
            <div className="col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <Select 
                value={item.productId || ''} 
                onValueChange={(value) => {
                  if (value === 'custom') {
                    handleItemChange(index, 'productId', 'custom');
                    handleItemChange(index, 'name', '');
                    handleItemChange(index, 'description', '');
                    handleItemChange(index, 'amount', 0);
                  } else {
                    const product = hvacProducts.find(p => p.id === value);
                    if (product) {
                      handleItemChange(index, 'productId', value);
                      handleItemChange(index, 'name', product.name);
                      handleItemChange(index, 'description', product.description);
                      handleItemChange(index, 'amount', product.basePrice);
                    }
                  }
                }}
              >
                <SelectTrigger className="h-[40px]">
                  <SelectValue placeholder="Select HVAC product" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="custom">Custom Product</SelectItem>
                  {Object.entries(productCategories).map(([category, products]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-semibold text-gray-500">{category}</div>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ${product.basePrice.toLocaleString()}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <FloatingLabelInput
                id={`itemQuantity${index}`}
                label="Qty"
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="col-span-2">
              <FloatingLabelInput
                id={`itemAmount${index}`}
                label="Amount"
                type="number"
                value={item.amount}
                onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="col-span-2">
              <FloatingLabelInput
                id={`itemTotal${index}`}
                label="Total"
                type="number"
                value={(item.quantity * item.amount).toFixed(2)}
                disabled
              />
            </div>
            {index > 0 && (
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-[40px] w-[40px]"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Move buttons - Mobile */}
          {items.length > 1 && (
            <div className="md:hidden flex gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-8 px-2 text-xs"
                onClick={() => moveItemUp(index)}
                disabled={index === 0}
              >
                <ChevronUp className="h-3 w-3" />
                Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-8 px-2 text-xs"
                onClick={() => moveItemDown(index)}
                disabled={index === items.length - 1}
              >
                <ChevronDown className="h-3 w-3" />
                Down
              </Button>
            </div>
          )}
          
          {/* Mobile Layout */}
          <div className="md:hidden space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <Select 
                value={item.productId || ''} 
                onValueChange={(value) => {
                  if (value === 'custom') {
                    handleItemChange(index, 'productId', 'custom');
                    handleItemChange(index, 'name', '');
                    handleItemChange(index, 'description', '');
                    handleItemChange(index, 'amount', 0);
                  } else {
                    const product = hvacProducts.find(p => p.id === value);
                    if (product) {
                      handleItemChange(index, 'productId', value);
                      handleItemChange(index, 'name', product.name);
                      handleItemChange(index, 'description', product.description);
                      handleItemChange(index, 'amount', product.basePrice);
                    }
                  }
                }}
              >
                <SelectTrigger className="h-[48px] text-base">
                  <SelectValue placeholder="Select HVAC product" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="custom">Custom Product</SelectItem>
                  {Object.entries(productCategories).map(([category, products]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-semibold text-gray-500">{category}</div>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ${product.basePrice.toLocaleString()}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FloatingLabelInput
                  id={`itemQuantity${index}-mobile`}
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="h-[48px] text-base"
                />
              </div>
              <div>
                <FloatingLabelInput
                  id={`itemAmount${index}-mobile`}
                  label="Amount"
                  type="number"
                  value={item.amount}
                  onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="h-[48px] text-base"
                />
              </div>
              <div>
                <FloatingLabelInput
                  id={`itemTotal${index}-mobile`}
                  label="Total"
                  type="number"
                  value={(item.quantity * item.amount).toFixed(2)}
                  disabled
                  className="h-[48px] text-base"
                />
              </div>
            </div>
          </div>
          <FloatingLabelInput
            id={`itemName${index}`}
            label="Item Name"
            value={item.name || ''}
            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
          />
          <div className="mb-2">
            <textarea
              id={`itemDescription${index}`}
              value={item.description || ''}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter item description..."
            />
          </div>
          {index > 0 && (
            <div className="md:hidden">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-0 right-0 mt-2"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
      <Button type="button" onClick={addItem} className="bg-blue-600 text-white hover:bg-blue-700">Add Item</Button>
    </div>
  );
};

export default ItemDetails;
