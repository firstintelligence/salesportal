import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Info, FileText, ClipboardList, Phone, Calculator as CalcIcon, Leaf } from "lucide-react";
import { calculateLoanAmount, calculateMonthlyPayment } from "@/utils/financingCalculations";
import { getAvailableTermsForRate, calculateDealerFee, isValidRateTermCombination } from "@/utils/dealerFeeCalculations";
import { Calculator as SavingsCalculator } from "@/components/savings/Calculator";

const CalculatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  const calculatorData = location.state?.calculatorData;
  const initialTab = location.state?.tab || 'payment';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Payment Calculator State
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

  const availableTerms = getAvailableTermsForRate(interestRate);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (purchaseAmount <= 0) return;
    
    if (purchaseAmount >= 10000) {
      setAmortizationPeriod(240);
    } else {
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
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            Calculator
          </h1>
          <div className="w-8 md:w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Toggle Switch */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 mb-4 flex">
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'payment'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <CalcIcon className="h-4 w-4" />
            Payment Calculator
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'savings'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Leaf className="h-4 w-4" />
            Savings Calculator
          </button>
        </div>

        {/* Payment Calculator Content */}
        {activeTab === 'payment' && (
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="h-1.5 bg-emerald-500"></div>
            <div className="p-6 space-y-6">
              <div className="flex justify-end">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold text-sm">Special promo</span>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Estimated Monthly Payments</h3>
                <div className={`grid grid-cols-1 ${promoTerm < 60 ? 'md:grid-cols-2' : ''} gap-4`}>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-5 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-foreground/70 mb-1">Promo Period</p>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(promoPayment)}</p>
                    <p className="text-xs text-muted-foreground mt-2">{interestRate}% for {promoTerm} months</p>
                  </div>
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

                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">Administration Fee</Label>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(adminFee)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">Show Contractor Fees</Label>
                  <Switch
                    checked={showContractorFees}
                    onCheckedChange={setShowContractorFees}
                  />
                </div>

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

                <div className="border-t border-border pt-6 space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">Continue with this financing:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2"
                      onClick={() => navigate("/documents", { 
                        state: { 
                          customer,
                          tab: 'invoice',
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
                      onClick={() => navigate("/documents", { 
                        state: { 
                          customer,
                          tab: 'loan',
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
        )}

        {/* Savings Calculator Content */}
        {activeTab === 'savings' && (
          <SavingsCalculator />
        )}
      </div>
    </div>
  );
};

export default CalculatorPage;
