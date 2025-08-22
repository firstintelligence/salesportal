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
      
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="show-contractor-fees" className="text-sm font-medium">
          Show Contractor Fees
        </label>
        <Switch
          id="show-contractor-fees"
          checked={showContractorFees}
          onCheckedChange={setShowContractorFees}
        />
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
          />
        </div>

        {/* Contractor/Dealer Fee Section */}
        {showContractorFees && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="text-lg font-semibold mb-2 text-yellow-800">Contractor Fee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingLabelInput
                id="dealerFeePercentage"
                label="Dealer Fee (%)"
                value={`${dealerFee.percentage.toFixed(2)}%`}
                disabled
              />
              <FloatingLabelInput
                id="dealerFeeAmount"
                label="Dealer Fee Amount"
                value={`$${dealerFee.amount.toFixed(2)}`}
                disabled
              />
            </div>
            {!isValidRateTermCombination(financing.interestRate, financing.loanTerm) && (
              <p className="text-sm text-red-600 mt-2">
                No dealer fee rate available for {financing.interestRate}% interest at {financing.loanTerm} months
              </p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              * Dealer fees are calculated on invoice amount excluding admin fee and are for internal reference only
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancingSection;