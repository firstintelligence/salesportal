import React, { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProductListItem from './ProductListItem';

const ItemDetails = ({ items, handleItemChange, addItem, removeItem, moveItemUp, moveItemDown }) => {
  // Use stable callbacks to prevent unnecessary re-renders
  const handleMoveUp = useCallback((index) => {
    if (index > 0) {
      moveItemUp(index);
    }
  }, [moveItemUp]);

  const handleMoveDown = useCallback((index) => {
    if (index < items.length - 1) {
      moveItemDown(index);
    }
  }, [moveItemDown, items.length]);

  const handleRemove = useCallback((index) => {
    removeItem(index);
  }, [removeItem]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Products</h2>
        <span className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <ProductListItem
            key={item.id || `item-${index}`}
            item={item}
            index={index}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            isOnly={items.length === 1}
            onItemChange={handleItemChange}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}
      </div>
      
      <Button 
        type="button" 
        onClick={addItem} 
        className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Product
      </Button>
    </div>
  );
};

export default ItemDetails;
