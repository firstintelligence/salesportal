import React, { memo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProductListItem from './ProductListItem';

const ItemDetails = memo(({ items, handleItemChange, addItem, removeItem, moveItemUp, moveItemDown }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-2xl font-semibold">Products</h2>
        <span className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <ProductListItem
            key={item.id}
            item={item}
            index={index}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            isOnly={items.length === 1}
            onItemChange={handleItemChange}
            onRemove={removeItem}
            onMoveUp={moveItemUp}
            onMoveDown={moveItemDown}
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
});

ItemDetails.displayName = 'ItemDetails';

export default ItemDetails;
