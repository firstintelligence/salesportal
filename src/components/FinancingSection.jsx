import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateMonthlyPayment } from '../utils/financingCalculations';
import { formatCurrency } from '../utils/formatCurrency';

const FinancingSection = ({ financing, setFinancing, currencyCode }) => {
  const interestRates = [
    0, 0.99, 1.99, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10.99, 11.99, 12.99, 13.99
  ];

  const monthlyPayment = calculateMonthlyPayment(
    financing.loanAmount, 
    financing.interestRate, 
    financing.loanTerm
  );

  const adminFee = Math.min(financing.loanAmount * 0.0149, 149);

  const handleFinancingChange = (field, value) => {
    setFinancing(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4">Financing Payment Details</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <FloatingLabelInput
          id="financeCompany"
          label="Finance Company"
          value={financing.financeCompany}
          onChange={(e) => handleFinancingChange('financeCompany', e.target.value)}
          disabled
        />
        
        <FloatingLabelInput
          id="loanAmount"
          label={`Loan Amount (${currencyCode})`}
          value={formatCurrency(financing.loanAmount, currencyCode)}
          disabled
        />

        <FloatingLabelInput
          id="adminFee"
          label={`Admin Fee (${currencyCode})`}
          value={formatCurrency(adminFee, currencyCode)}
          disabled
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amortization Period</label>
          <Select 
            value={financing.amortizationPeriod.toString()} 
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term</label>
          <Select 
            value={financing.loanTerm.toString()} 
            onValueChange={(value) => handleFinancingChange('loanTerm', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 months</SelectItem>
              <SelectItem value="36">36 months</SelectItem>
              <SelectItem value="48">48 months</SelectItem>
              <SelectItem value="60">60 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate</label>
            <Select 
              value={financing.interestRate.toString()} 
              onValueChange={(value) => handleFinancingChange('interestRate', parseFloat(value))}
            >
              <SelectTrigger>
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
            label={`Monthly Payment (${currencyCode})`}
            value={formatCurrency(monthlyPayment, currencyCode)}
            disabled
          />
        </div>
      </div>
    </div>
  );
};

export default FinancingSection;