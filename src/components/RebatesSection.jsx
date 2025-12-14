import React, { useState } from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Switch } from "@/components/ui/switch";
const RebatesSection = ({ rebatesIncentives, setRebatesIncentives }) => {
  const [auditRequired, setAuditRequired] = useState(false);
  
  const handleRebateChange = (field, value) => {
    setRebatesIncentives(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleAuditToggle = () => {
    const newValue = !auditRequired;
    setAuditRequired(newValue);
    
    if (newValue) {
      // Set default HRSP values
      setRebatesIncentives(prev => ({
        ...prev,
        provincialRebate: 5000
      }));
    } else {
      // Clear values when toggled off
      setRebatesIncentives(prev => ({
        ...prev,
        provincialRebate: 0
      }));
    }
  };

  // Calculate total rebates with utility rebate multiplied by 12 (annual)
  const totalRebates = Object.entries(rebatesIncentives).reduce((sum, [key, value]) => {
    if (key === 'federalRebate') return sum; // Skip federal rebate (removed)
    if (key === 'utilityRebate') {
      return sum + (value * 12); // Multiply monthly utility rebate by 12
    }
    return sum + value;
  }, 0);

  return (
    <div className="mb-6 bg-blue-50 p-4 rounded-lg h-full">
      <h2 className="text-lg font-semibold mb-2">Rebates & Incentives</h2>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Audit Required</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{auditRequired ? 'Yes' : 'No'}</span>
          <Switch
            checked={auditRequired}
            onCheckedChange={handleAuditToggle}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <FloatingLabelInput
          id="provincialRebate"
          label="Enbridge Rebate"
          type="number"
          value={rebatesIncentives.provincialRebate}
          onChange={(e) => handleRebateChange('provincialRebate', e.target.value)}
          className="bg-white"
        />
        
        <FloatingLabelInput
          id="utilityRebate"
          label="Utility Rebate (Monthly)"
          type="number"
          value={rebatesIncentives.utilityRebate}
          onChange={(e) => handleRebateChange('utilityRebate', e.target.value)}
          className="bg-white"
        />
        
        <FloatingLabelInput
          id="manufacturerRebate"
          label="Manufacturer Rebate"
          type="number"
          value={rebatesIncentives.manufacturerRebate}
          onChange={(e) => handleRebateChange('manufacturerRebate', e.target.value)}
          className="bg-white"
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