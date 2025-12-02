import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Info } from "lucide-react";
import { calculateLoanAmount, calculateMonthlyPayment } from "@/utils/financingCalculations";
import { getAvailableTermsForRate } from "@/utils/dealerFeeCalculations";

const PaymentCalculatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  const [purchaseAmount, setPurchaseAmount] = useState(5250);
  const [interestRate, setInterestRate] = useState(9.99);
  const [amortizationPeriod, setAmortizationPeriod] = useState(180);
  const [promoTerm, setPromoTerm] = useState(36);

  const interestRates = [
    0, 0.99, 1.99, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10.99, 11.99, 12.99, 13.99
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

  const loanAmount = calculateLoanAmount(purchaseAmount);
  const adminFee = loanAmount - purchaseAmount;
  const promoPayment = calculateMonthlyPayment(loanAmount, interestRate, amortizationPeriod);
  const regularPayment = calculateMonthlyPayment(loanAmount, regularRate, amortizationPeriod);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/landing")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tools
        </Button>
      </div>

      <div className="container max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-4">
            <h1 className="text-2xl font-bold text-foreground">Installment loan estimate</h1>
          </div>

          {/* Green Progress Bar */}
          <div className="h-2 bg-emerald-500"></div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Special Promo Badge */}
            <div className="flex justify-end">
              <span className="text-yellow-600 font-semibold text-sm">Special promo</span>
            </div>

            {/* Promo Rate Display */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {interestRate}% APR for {promoTerm} Months
              </h2>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Monthly payment</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(promoPayment)} <span className="text-base font-normal">({interestRate}% for {promoTerm} months)</span>
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(regularPayment)} <span className="text-base font-normal">({regularRate}% for {remainingMonths} months)</span>
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              {/* Purchase Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="purchaseAmount">Purchase amount</Label>
                <Input
                  id="purchaseAmount"
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                  className="text-right font-semibold"
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

              {/* Amortization Period Select */}
              <div className="flex justify-between items-center">
                <Label>Amortization period</Label>
                <Select value={amortizationPeriod.toString()} onValueChange={(value) => setAmortizationPeriod(parseInt(value))}>
                  <SelectTrigger className="w-40 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                    <SelectItem value="48">48 months</SelectItem>
                    <SelectItem value="60">60 months</SelectItem>
                    <SelectItem value="84">84 months</SelectItem>
                    <SelectItem value="120">120 months</SelectItem>
                    <SelectItem value="180">180 months</SelectItem>
                    <SelectItem value="240">240 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Promo Term Select */}
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

              {/* Administration Fee */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label>Administration fee</Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-semibold">{formatCurrency(adminFee)}</span>
              </div>
            </div>

            {/* Learn More Link */}
            <div className="flex justify-end pt-4">
              <a href="#" className="text-primary font-semibold hover:underline">
                Learn more
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCalculatorPage;
