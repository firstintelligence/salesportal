// Calculate loan amount with 1.49% fee (max $149)
export const calculateLoanAmount = (invoiceTotal) => {
  const fee = Math.min(invoiceTotal * 0.0149, 149);
  return invoiceTotal + fee;
};

// Calculate monthly payment using loan amount, interest rate, and amortization period
export const calculateMonthlyPayment = (loanAmount, interestRate, amortizationPeriod) => {
  if (interestRate === 0) {
    return loanAmount / amortizationPeriod;
  }
  
  const monthlyRate = interestRate / 100 / 12;
  const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, amortizationPeriod)) / 
                  (Math.pow(1 + monthlyRate, amortizationPeriod) - 1);
  
  return payment;
};

// Generate invoice number: GPHxy1234
export const generateInvoiceNumber = (firstName, lastName, phone) => {
  if (!firstName || !lastName || !phone) return 'GPH0000';
  
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  const phoneDigits = phone.replace(/\D/g, ''); // Remove non-digits
  const lastFourDigits = phoneDigits.slice(-4).padStart(4, '0');
  
  return `GPH${firstInitial}${lastInitial}${lastFourDigits}`;
};

// Get tax rate by province
export const getProvincialTax = (provinceCode) => {
  const taxRates = {
    'AB': 5,      // Alberta - GST only
    'BC': 12,     // British Columbia - HST
    'MB': 12,     // Manitoba - GST + PST
    'NB': 15,     // New Brunswick - HST
    'NL': 15,     // Newfoundland and Labrador - HST
    'NS': 15,     // Nova Scotia - HST
    'NT': 5,      // Northwest Territories - GST only
    'NU': 5,      // Nunavut - GST only
    'ON': 13,     // Ontario - HST
    'PE': 15,     // Prince Edward Island - HST
    'QC': 14.975, // Quebec - GST + QST
    'SK': 11,     // Saskatchewan - GST + PST
    'YT': 5       // Yukon - GST only
  };
  
  return taxRates[provinceCode] || 13; // Default to Ontario rate
};