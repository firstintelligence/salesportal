import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { calculateMonthlyPayment } from '../utils/financingCalculations';
import { calculateDealerFee, getAvailableTermsForRate, isValidRateTermCombination } from '../utils/dealerFeeCalculations';

const FinancingSection = ({ financing, setFinancing, invoiceAmount = 0, showContractorFees = false, setShowContractorFees = () => {} }) => {
  const interestRates = [
    0, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10.99, 11.99, 12.99, 13.99, 16.99
  ];

  const monthlyPayment = calculateMonthlyPayment(
    financing.loanAmount || 0, 
    financing.interestRate || 0, 
    financing.amortizationPeriod || 180
  ) || 0;

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

  // Format number with commas
  const formatWithCommas = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="mb-6 bg-green-50 p-3 md:p-4 rounded-lg h-full">
      <h2 className="text-base md:text-lg font-semibold mb-2">Financing Payment Details</h2>
      
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <span className="text-xs md:text-sm font-medium">Show Contractor Fees</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{showContractorFees ? 'ON' : 'OFF'}</span>
          <Switch
            checked={showContractorFees}
            onCheckedChange={setShowContractorFees}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Finance Company, Loan Amount, Admin Fee - displayed as plain text */}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] md:text-xs text-gray-600">Finance Company:</span>
            <span className="text-xs md:text-sm font-semibold text-gray-900">{financing.financeCompany}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] md:text-xs text-gray-600">Loan Amount:</span>
            <span className="text-xs md:text-sm font-semibold text-gray-900">${formatWithCommas(financing.loanAmount || 0)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] md:text-xs text-gray-600">Admin Fee:</span>
            <span className="text-xs md:text-sm font-semibold text-gray-900">${formatWithCommas(Math.min((financing.loanAmount || 0) * 0.0149, 149))}</span>
          </div>
        </div>

        {/* Promo Term + Amortization - 2 columns */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div>
            <label className="block text-[10px] md:text-xs font-medium text-gray-700 mb-1">Promo Term</label>
            <Select 
              value={(financing.loanTerm || 24).toString()} 
              onValueChange={(value) => handleFinancingChange('loanTerm', parseInt(value))}
            >
              <SelectTrigger className="text-left h-[40px] text-xs md:text-sm bg-white border-gray-300">
                <SelectValue className="text-left" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
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

          <div>
            <label className="block text-[10px] md:text-xs font-medium text-gray-700 mb-1">Amortization</label>
            <Select 
              value={(financing.amortizationPeriod || 180).toString()} 
              onValueChange={(value) => handleFinancingChange('amortizationPeriod', parseInt(value))}
            >
              <SelectTrigger className="text-left h-[40px] text-xs md:text-sm bg-white border-gray-300">
                <SelectValue className="text-left" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
                <SelectItem value="36">36 months</SelectItem>
                <SelectItem value="48">48 months</SelectItem>
                <SelectItem value="60">60 months</SelectItem>
                <SelectItem value="72">72 months</SelectItem>
                <SelectItem value="84">84 months</SelectItem>
                <SelectItem value="96">96 months</SelectItem>
                <SelectItem value="108">108 months</SelectItem>
                <SelectItem value="120">120 months</SelectItem>
                <SelectItem value="132">132 months</SelectItem>
                <SelectItem value="144">144 months</SelectItem>
                <SelectItem value="180">180 months</SelectItem>
                <SelectItem value="240">240 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Interest Rate + Monthly Payment - 2 columns */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 items-end">
          <div>
            <label className="block text-[10px] md:text-xs font-medium text-gray-700 mb-1">Interest Rate</label>
            <Select 
              value={(financing.interestRate || 0).toString()} 
              onValueChange={(value) => handleFinancingChange('interestRate', parseFloat(value))}
            >
              <SelectTrigger className="h-[40px] text-xs md:text-sm bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {interestRates.map(rate => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[10px] md:text-xs font-medium text-gray-700 mb-1">Monthly Payment</label>
            <div className="px-2.5 py-2 h-[40px] text-xs md:text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 font-semibold flex items-center">
              ${formatWithCommas(monthlyPayment)}
            </div>
          </div>
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