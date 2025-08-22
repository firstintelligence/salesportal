import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { calculateMonthlyPayment } from '../utils/financingCalculations';
import { calculateDealerFee, getAvailableTermsForRate, isValidRateTermCombination } from '../utils/dealerFeeCalculations';
const FinancingSection = ({ financing, setFinancing, invoiceAmount = 0, showContractorFees = false, setShowContractorFees = () => {} }) => {
  const interestRates = [
    0, 0.99, 1.99, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10.99, 11.99, 12.99, 13.99
  ];

  const monthlyPayment = calculateMonthlyPayment(
    financing.loanAmount, 
    financing.interestRate, 
    financing.amortizationPeriod
  );

  const adminFee = Math.min(financing.loanAmount * 0.0149, 149);

  // Calculate dealer fee based on invoice amount (excluding admin fee)
  const dealerFee = calculateDealerFee(
    financing.interestRate, 
    financing.loanTerm, 
    invoiceAmount
  );

  // Get available terms for current interest rate
  const availableTerms = getAvailableTermsForRate(financing.interestRate);

  const handleFinancingChange = (field, value) => {
    setFinancing(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-2">Financing Payment Details</h2>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Show Contractor Fees</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{showContractorFees ? 'ON' : 'OFF'}</span>
          <Switch
            checked={showContractorFees}
            onCheckedChange={setShowContractorFees}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <FloatingLabelInput
          id="financeCompany"
          label="Finance Company"
          value={financing.financeCompany}
          onChange={(e) => handleFinancingChange('financeCompany', e.target.value)}
          disabled
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingLabelInput
            id="loanAmount"
            label="Loan Amount"
            value={`$${(financing.loanAmount || 0).toFixed(2)}`}
            disabled
          />

          <FloatingLabelInput
            id="adminFee"
            label="Admin Fee"
            value={`$${Math.min((financing.loanAmount || 0) * 0.0149, 149).toFixed(2)}`}
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amortization Period</label>
            <Select 
              value={(financing.amortizationPeriod || 180).toString()} 
              onValueChange={(value) => handleFinancingChange('amortizationPeriod', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="180">180 months (15 years)</SelectItem>
                <SelectItem value="240">240 months (20 years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promotional Term</label>
            <Select 
              value={(financing.loanTerm || 24).toString()} 
              onValueChange={(value) => handleFinancingChange('loanTerm', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTerms.length > 0 ? (
                  availableTerms.map(term => (
                    <SelectItem key={term} value={term.toString()}>
                      {term} months
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                    <SelectItem value="48">48 months</SelectItem>
                    <SelectItem value="60">60 months</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate</label>
            <Select 
              value={(financing.interestRate || 0).toString()} 
              onValueChange={(value) => handleFinancingChange('interestRate', parseFloat(value))}
            >
              <SelectTrigger className="h-[40px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interestRates.map(rate => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FloatingLabelInput
            id="monthlyPayment"
            label="Monthly Payment"
            value={`$${monthlyPayment.toFixed(2)}`}
            disabled
            className="bg-green-50 border-green-200"
          />
        </div>

        {/* Contractor/Dealer Fee Section */}
        {showContractorFees && (
          <div className="mt-3 text-xs text-gray-500 bg-gray-50/30 p-2 rounded">
            <div className="flex justify-between items-center">
              <span>Dealer Fee: {dealerFee.percentage.toFixed(2)}%</span>
              <span>Fee Amount: ${dealerFee.amount.toFixed(2)}</span>
            </div>
            {!isValidRateTermCombination(financing.interestRate, financing.loanTerm) && (
              <p className="text-xs text-red-500 mt-1">
                No dealer fee rate available for {financing.interestRate}% interest at {financing.loanTerm} months
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancingSection;