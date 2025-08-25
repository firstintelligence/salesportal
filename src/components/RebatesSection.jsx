import React, { useState } from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Button } from "@/components/ui/button";
const RebatesSection = ({ rebatesIncentives, setRebatesIncentives }) => {
  const [useCGHG, setUseCGHG] = useState(false);
  
  const handleRebateChange = (field, value) => {
    setRebatesIncentives(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleCGHGToggle = () => {
    const newValue = !useCGHG;
    setUseCGHG(newValue);
    
    if (newValue) {
      // Set default CGHG/CGHL values
      setRebatesIncentives(prev => ({
        ...prev,
        federalRebate: 5000,
        provincialRebate: 5000
      }));
    } else {
      // Clear values when toggled off
      setRebatesIncentives(prev => ({
        ...prev,
        federalRebate: 0,
        provincialRebate: 0
      }));
    }
  };

  // Calculate total rebates with utility rebate multiplied by 12 (annual)
  const totalRebates = Object.entries(rebatesIncentives).reduce((sum, [key, value]) => {
    if (key === 'utilityRebate') {
      return sum + (value * 12); // Multiply monthly utility rebate by 12
    }
    return sum + value;
  }, 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Rebates & Incentives</h2>
        <Button
          type="button"
          variant={useCGHG ? "default" : "outline"}
          size="sm"
          onClick={handleCGHGToggle}
        >
          Use CGHG/CGHL
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <FloatingLabelInput
          id="federalRebate"
          label="Canada Greener Homes Rebate"
          type="number"
          value={rebatesIncentives.federalRebate}
          onChange={(e) => handleRebateChange('federalRebate', e.target.value)}
        />
        
        <FloatingLabelInput
          id="provincialRebate"
          label="Enbridge Rebate"
          type="number"
          value={rebatesIncentives.provincialRebate}
          onChange={(e) => handleRebateChange('provincialRebate', e.target.value)}
        />
        
        <FloatingLabelInput
          id="utilityRebate"
          label="Utility Rebate (Monthly)"
          type="number"
          value={rebatesIncentives.utilityRebate}
          onChange={(e) => handleRebateChange('utilityRebate', e.target.value)}
        />
        
        <FloatingLabelInput
          id="manufacturerRebate"
          label="Manufacturer Rebate"
          type="number"
          value={rebatesIncentives.manufacturerRebate}
          onChange={(e) => handleRebateChange('manufacturerRebate', e.target.value)}
        />
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <div className="flex justify-between font-bold">
          <span>Total Rebates & Incentives:</span>
          <span>${totalRebates.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default RebatesSection;