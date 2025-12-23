// Dealer fee rates based on interest rate and promotional term combinations
const dealerFeeRates = {
  // Free Program
  '13.99-0': 0,
  
  // 0% Interest promotional rates
  '0-3': 3.99,
  '0-6': 9.49,
  '0-9': 12.99,
  '0-12': 13.49,
  '0-24': 20.49,
  '0-36': 24.49,
  '0-48': 26.99,
  '0-60': 31.99,
  
  // 2.99% Interest rates
  '2.99-12': 12.99,
  '2.99-24': 15.99,
  '2.99-36': 18.99,
  '2.99-48': 21.99,
  '2.99-60': 24.99,
  
  // 3.99% Interest rates
  '3.99-12': 11.99,
  '3.99-24': 14.99,
  '3.99-36': 17.99,
  '3.99-60': 23.99,
  
  // 4.99% Interest rates
  '4.99-12': 10.99,
  '4.99-24': 13.99,
  '4.99-36': 16.99,
  '4.99-48': 19.99,
  '4.99-60': 22.99,
  
  // 5.99% Interest rates
  '5.99-12': 9.99,
  '5.99-24': 12.99,
  '5.99-36': 15.99,
  '5.99-48': 18.99,
  '5.99-60': 21.99,
  
  // 6.99% Interest rates
  '6.99-12': 8.99,
  '6.99-24': 11.99,
  '6.99-36': 14.99,
  '6.99-48': 17.99,
  '6.99-60': 20.99,
  
  // 7.99% Interest rates
  '7.99-12': 7.99,
  '7.99-24': 9.99,
  '7.99-36': 12.99,
  '7.99-48': 15.99,
  '7.99-60': 18.99,
  
  // 8.99% Interest rates
  '8.99-12': 6.99,
  '8.99-24': 7.99,
  '8.99-36': 9.99,
  '8.99-48': 11.99,
  '8.99-60': 13.99,
  
  // 9.99% Interest rates
  '9.99-12': 5.99,
  '9.99-24': 6.99,
  '9.99-36': 8.99,
  '9.99-48': 10.99,
  '9.99-60': 12.99,
  
  // 10.99% Interest rates
  '10.99-12': 4.99,
  '10.99-24': 5.99,
  '10.99-36': 7.99,
  '10.99-48': 9.99,
  '10.99-60': 11.99,
  
  // 11.99% Interest rates
  '11.99-12': 3.99,
  '11.99-24': 4.99,
  '11.99-36': 6.99,
  '11.99-48': 8.99,
  
  // 12.99% Interest rates
  '12.99-12': 2.99,
  '12.99-24': 3.99,
  '12.99-36': 5.99,
  '12.99-48': 7.99,
  
  // 13.99% Interest rates
  '13.99-12': 1.99,
  '13.99-24': 2.99,
  '13.99-36': 4.99,
  '13.99-48': 6.99
};

// Calculate dealer fee based on interest rate and promotional term
export const calculateDealerFee = (interestRate, promotionalTerm, invoiceAmount) => {
  if (!interestRate || !promotionalTerm || !invoiceAmount) return { percentage: 0, amount: 0 };
  
  const key = `${interestRate}-${promotionalTerm}`;
  const feePercentage = dealerFeeRates[key] || 0;
  const feeAmount = (invoiceAmount * feePercentage) / 100;
  
  return {
    percentage: feePercentage,
    amount: feeAmount
  };
};

// Get all available promotional terms for a given interest rate
export const getAvailableTermsForRate = (interestRate) => {
  const terms = [];
  Object.keys(dealerFeeRates).forEach(key => {
    const [rate, term] = key.split('-');
    if (parseFloat(rate) === parseFloat(interestRate)) {
      terms.push(parseInt(term));
    }
  });
  return [...new Set(terms)].sort((a, b) => a - b);
};

// Check if a rate/term combination exists
export const isValidRateTermCombination = (interestRate, promotionalTerm) => {
  const key = `${interestRate}-${promotionalTerm}`;
  return dealerFeeRates.hasOwnProperty(key);
};
