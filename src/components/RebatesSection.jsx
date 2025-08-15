import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
const RebatesSection = ({ rebatesIncentives, setRebatesIncentives }) => {
  const handleRebateChange = (field, value) => {
    setRebatesIncentives(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
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
      <h2 className="text-2xl font-semibold mb-4">Rebates & Incentives</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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