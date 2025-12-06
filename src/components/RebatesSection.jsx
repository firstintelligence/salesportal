import React, { useState } from 'react';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import { Switch } from "@/components/ui/switch";

const RebatesSection = ({ rebatesIncentives, setRebatesIncentives }) => {
  const [useCGHG, setUseCGHG] = useState(false);
  
  const handleRebateChange = (field, value) => {
    setRebatesIncentives(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleCGHGToggle = () => {
    const newValue = !useCGHG;
    setUseCGHG(newValue);
    
    if (newValue) {
      setRebatesIncentives(prev => ({
        ...prev,
        federalRebate: 5000,
        provincialRebate: 5000
      }));
    } else {
      setRebatesIncentives(prev => ({
        ...prev,
        federalRebate: 0,
        provincialRebate: 0
      }));
    }
  };

  const totalRebates = Object.entries(rebatesIncentives).reduce((sum, [key, value]) => {
    if (key === 'utilityRebate') {
      return sum + (value * 12);
    }
    return sum + value;
  }, 0);

  return (
    <div className="mb-6 h-full">
      <h2 className="text-2xl font-semibold mb-2">Rebates & Incentives</h2>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Use CGHG/CGHL</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{useCGHG ? 'ON' : 'OFF'}</span>
          <Switch
            checked={useCGHG}
            onCheckedChange={handleCGHGToggle}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
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
