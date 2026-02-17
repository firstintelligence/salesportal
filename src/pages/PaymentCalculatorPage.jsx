import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Info, FileText, ClipboardList, Phone } from "lucide-react";
import { calculateLoanAmount, calculateMonthlyPayment } from "@/utils/financingCalculations";
import { getAvailableTermsForRate, calculateDealerFee, isValidRateTermCombination } from "@/utils/dealerFeeCalculations";

const PaymentCalculatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  const calculatorData = location.state?.calculatorData;
  
  // Initialize with blank values or preloaded data - never use hardcoded defaults
  const [purchaseAmount, setPurchaseAmount] = useState(calculatorData?.purchaseAmount || 0);
  const [purchaseAmountDisplay, setPurchaseAmountDisplay] = useState(calculatorData?.purchaseAmount ? `$${calculatorData.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '');
  const [interestRate, setInterestRate] = useState(calculatorData?.interestRate ?? 9.99);
  const [amortizationPeriod, setAmortizationPeriod] = useState(calculatorData?.amortizationPeriod || 180);
  const [promoTerm, setPromoTerm] = useState(calculatorData?.promoTerm || 36);
  const [show240Warning, setShow240Warning] = useState(false);
  const [showContractorFees, setShowContractorFees] = useState(false);

  const is240Available = purchaseAmount >= 10000;

  const formatInputCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handlePurchaseAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    const numValue = parseFloat(rawValue) || 0;
    setPurchaseAmount(numValue);
    setPurchaseAmountDisplay(rawValue);
  };

  const handlePurchaseAmountBlur = () => {
    setPurchaseAmountDisplay(formatInputCurrency(purchaseAmount));
  };

  const handlePurchaseAmountFocus = () => {
    setPurchaseAmountDisplay(purchaseAmount.toString());
  };

  const interestRates = [
    0, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10.99, 11.99, 12.99, 13.99, 16.99
  ];

  const regularRate = 13.99;
  const remainingMonths = 60 - promoTerm;

  // Get available terms for current interest rate
  const availableTerms = getAvailableTermsForRate(interestRate);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  // Auto-select highest available amortization based on purchase amount
  // Only run when there's an actual purchase amount entered
  useEffect(() => {
    if (purchaseAmount <= 0) return; // Don't auto-adjust for zero/blank amounts
    
    if (purchaseAmount >= 10000) {
      setAmortizationPeriod(240);
    } else {
      // If currently at 240 and amount drops below 10K, reset to 180
      if (amortizationPeriod === 240) {
        setShow240Warning(true);
        setTimeout(() => setShow240Warning(false), 3000);
        setAmortizationPeriod(180);
      }
    }
  }, [purchaseAmount]);

  const handleAmortizationChange = (value) => {
    const newPeriod = parseInt(value);
    if (newPeriod === 240 && purchaseAmount < 10000) {
      setShow240Warning(true);
      setTimeout(() => setShow240Warning(false), 3000);
      return;
    }
    setAmortizationPeriod(newPeriod);
  };

  const loanAmount = calculateLoanAmount(purchaseAmount);
  const adminFee = loanAmount - purchaseAmount;
  const promoPayment = calculateMonthlyPayment(loanAmount, interestRate, amortizationPeriod);
  const regularPayment = calculateMonthlyPayment(loanAmount, regularRate, amortizationPeriod);
  
  // Dealer fee calculation
  const dealerFee = calculateDealerFee(interestRate, promoTerm, loanAmount);
  const isValidCombination = isValidRateTermCombination(interestRate, promoTerm);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/landing")}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            Payment Calculator
          </h1>
          <div className="w-8 md:w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">

          {/* Green Progress Bar */}
          <div className="h-1.5 bg-emerald-500"></div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Special Promo Badge */}
            <div className="flex justify-end">
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold text-sm">Special promo</span>
            </div>

            {/* Estimated Monthly Payments - Main Focus */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Estimated Monthly Payments</h3>
              <div className={`grid grid-cols-1 ${promoTerm < 60 ? 'md:grid-cols-2' : ''} gap-4`}>
                {/* Promo Period - highlighted but with dark text */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-5 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-foreground/70 mb-1">Promo Period</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(promoPayment)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{interestRate}% for {promoTerm} months</p>
                </div>
                {/* After Promo - only show if promo term is less than 60 months */}
                {promoTerm < 60 && (
                  <div className="rounded-lg p-5 border border-border/50">
                    <p className="text-sm text-muted-foreground/70 mb-1">After Promo</p>
                    <p className="text-2xl font-medium text-muted-foreground">{formatCurrency(regularPayment)}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">{regularRate}% for {remainingMonths} months</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              {/* Purchase Amount Input - formatted currency */}
              <div className="flex justify-between items-center">
                <Label htmlFor="purchaseAmount">Purchase Amount</Label>
                <Input
                  id="purchaseAmount"
                  type="text"
                  value={purchaseAmountDisplay}
                  onChange={handlePurchaseAmountChange}
                  onBlur={handlePurchaseAmountBlur}
                  onFocus={handlePurchaseAmountFocus}
                  className="w-40 text-right font-semibold"
                />
              </div>

              {/* Interest Rate Select */}
              <div className="flex justify-between items-center">
                <Label>Interest Rate</Label>
                <Select value={interestRate.toString()} onValueChange={(value) => setInterestRate(parseFloat(value))}>
                  <SelectTrigger className="w-40 font-semibold">
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

              {/* Promo Term Select - moved above amortization */}
              <div className="flex justify-between items-center">
                <Label>Promo Term</Label>
                <Select value={promoTerm.toString()} onValueChange={(value) => setPromoTerm(parseInt(value))}>
                  <SelectTrigger className="w-40 font-semibold">
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
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="18">18 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Amortization Period Select */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label>Amortization Period</Label>
                  <Select value={amortizationPeriod.toString()} onValueChange={handleAmortizationChange}>
                    <SelectTrigger className="w-40 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 months</SelectItem>
                      <SelectItem value="72">72 months</SelectItem>
                      <SelectItem value="84">84 months</SelectItem>
                      <SelectItem value="96">96 months</SelectItem>
                      <SelectItem value="108">108 months</SelectItem>
                      <SelectItem value="120">120 months</SelectItem>
                      <SelectItem value="132">132 months</SelectItem>
                      <SelectItem value="144">144 months</SelectItem>
                      <SelectItem value="180">180 months</SelectItem>
                      <SelectItem value="240" disabled={!is240Available} className={!is240Available ? "text-muted-foreground/50" : ""}>
                        240 months
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {show240Warning && (
                  <p className="text-xs text-amber-600 text-right">240 months requires $10,000+</p>
                )}
              </div>

              {/* Administration Fee */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground">Administration Fee</Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(adminFee)}</span>
              </div>

              {/* Show Contractor Fees Toggle */}
              <div className="flex justify-between items-center">
                <Label className="text-muted-foreground">Show Contractor Fees</Label>
                <Switch
                  checked={showContractorFees}
                  onCheckedChange={setShowContractorFees}
                />
              </div>

              {/* Dealer Fee - only shown when toggle is on */}
              {showContractorFees && isValidCombination && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg px-4 py-3 border border-amber-200 dark:border-amber-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label className="text-amber-700 dark:text-amber-400">Dealer Fee ({dealerFee.percentage}%)</Label>
                    </div>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(dealerFee.amount)}</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    Net to dealer: {formatCurrency(loanAmount - dealerFee.amount)}
                  </p>
                </div>
              )}

              {showContractorFees && !isValidCombination && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3 border border-border">
                  <p className="text-sm text-muted-foreground">
                    No dealer fee rate available for {interestRate}% @ {promoTerm} months
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-border pt-6 space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Continue with this financing:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => navigate("/invoice-generator", { 
                      state: { 
                        customer,
                        fromCalculator: true,
                        calculatorData: {
                          purchaseAmount,
                          interestRate,
                          amortizationPeriod,
                          promoTerm,
                          promoPayment,
                          regularPayment,
                          loanAmount
                        }
                      }
                    })}
                  >
                    <FileText className="h-4 w-4" />
                    Create Invoice
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => navigate("/loan-application", { 
                      state: { 
                        customer,
                        fromCalculator: true,
                        calculatorData: {
                          purchaseAmount,
                          interestRate,
                          amortizationPeriod,
                          promoTerm,
                          loanAmount
                        }
                      }
                    })}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Loan Application
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => navigate("/tpv-ai", { 
                      state: { 
                        customer,
                        fromCalculator: true,
                        calculatorData: {
                          purchaseAmount,
                          interestRate,
                          amortizationPeriod,
                          promoTerm,
                          promoPayment
                        }
                      }
                    })}
                  >
                    <Phone className="h-4 w-4" />
                    Request TPV
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCalculatorPage;
