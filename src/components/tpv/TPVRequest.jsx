import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import InputMask from "react-input-mask";
import { useTenant } from "@/contexts/TenantContext";
import { capitalizeWords, formatPostalCode } from "@/utils/inputFormatting";
import { calculateLoanAmount, calculateMonthlyPayment } from "@/utils/financingCalculations";
import { getSimplifiedProductName } from "@/utils/productNameSimplifier";

const canadianProvinces = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

// Grouped products for easier selection
const productGroups = [
  {
    label: "Heating & Cooling",
    products: ["Heat Pump", "Furnace", "Air Conditioner", "Ductless Mini Split", "Air Handler", "Boiler"]
  },
  {
    label: "Hot Water",
    products: ["Tankless Water Heater", "Hybrid Water Heater", "PV Water Heater", "CV Water Heater", "Electric Water Heater"]
  },
  {
    label: "Water Filtration",
    products: ["UV Water Filter", "Carbon Filter", "Water Softener"]
  },
  {
    label: "Air Filtration",
    products: ["UV Air Filter", "Air Purifier", "EAC", "HEPA Filter", "HRV"]
  },
  {
    label: "Insulation",
    products: ["Attic Insulation", "Air Sealing"]
  },
  {
    label: "Energy",
    products: ["Home Battery", "Solar Panels"]
  },
  {
    label: "Services",
    products: ["Duct Cleaning", "Maintenance Plan", "Plumbing Repairs", "Electrical Work", "Sheet Metal"]
  }
];

const interestRates = [
  "0%", "2.99%", "3.99%", "4.99%", "5.99%", "6.99%", "7.99%", "8.99%", "9.99%", 
  "10.99%", "11.99%", "12.99%", "13.99%", "16.99%"
];

const promotionalTerms = [
  "6 months", "12 months", "18 months", "24 months",
  "36 months", "48 months", "60 months"
];

const amortizationPeriods = [
  "60 months", "72 months", "84 months", "96 months", 
  "108 months", "120 months", "132 months", "144 months", "180 months", "240 months"
];

const TPVRequest = ({ onBack, preloadedCustomer, preloadedCalculatorData }) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract products from preloadedCalculatorData if available - use simplified names for TPV
  const getPreloadedProducts = () => {
    if (preloadedCalculatorData?.items && Array.isArray(preloadedCalculatorData.items)) {
      // Items from invoice generator - use simplified product names for TPV
      const simplifiedNames = preloadedCalculatorData.items
        .filter(item => item.productId || item.name)
        .map(item => getSimplifiedProductName(item.productId, item.name || item));
      // Remove duplicates
      return [...new Set(simplifiedNames)];
    }
    if (preloadedCalculatorData?.products && Array.isArray(preloadedCalculatorData.products)) {
      return preloadedCalculatorData.products;
    }
    return [];
  };
  
  const [formData, setFormData] = useState(() => {
    const preloadedProducts = getPreloadedProducts();
    
    // If preloaded customer data exists, use it
    if (preloadedCustomer) {
      // Calculate monthly payment using same formula as invoice generator
      let monthlyPayment = "";
      if (preloadedCalculatorData?.purchaseAmount && preloadedCalculatorData?.amortizationPeriod) {
        const loanAmount = calculateLoanAmount(preloadedCalculatorData.purchaseAmount);
        const rate = preloadedCalculatorData.interestRate || 0;
        const months = preloadedCalculatorData.amortizationPeriod;
        monthlyPayment = calculateMonthlyPayment(loanAmount, rate, months).toFixed(2);
      }
      
      return {
        firstName: preloadedCustomer.first_name || "",
        lastName: preloadedCustomer.last_name || "",
        phoneNumber: preloadedCustomer.phone || "",
        email: preloadedCustomer.email || "",
        address: preloadedCustomer.address || "",
        city: preloadedCustomer.city || "",
        province: preloadedCustomer.province || "",
        postalCode: preloadedCustomer.postal_code || "",
        products: preloadedProducts,
        salesPrice: preloadedCalculatorData ? `$${preloadedCalculatorData.purchaseAmount?.toLocaleString() || ''}` : "",
        interestRate: preloadedCalculatorData?.interestRate !== undefined ? `${preloadedCalculatorData.interestRate}%` : "",
        promotionalTerm: preloadedCalculatorData?.promoTerm ? `${preloadedCalculatorData.promoTerm} months` : "",
        amortization: preloadedCalculatorData?.amortizationPeriod ? `${preloadedCalculatorData.amortizationPeriod} months` : "",
        monthlyPayment: monthlyPayment,
      };
    }
    
    // If calculator data exists without customer, use it with blank customer fields
    if (preloadedCalculatorData) {
      // Calculate monthly payment using same formula as invoice generator
      let monthlyPayment = "";
      if (preloadedCalculatorData.purchaseAmount && preloadedCalculatorData.amortizationPeriod) {
        const loanAmount = calculateLoanAmount(preloadedCalculatorData.purchaseAmount);
        const rate = preloadedCalculatorData.interestRate || 0;
        const months = preloadedCalculatorData.amortizationPeriod;
        monthlyPayment = calculateMonthlyPayment(loanAmount, rate, months).toFixed(2);
      }
      
      return {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        address: "",
        city: "",
        province: "",
        postalCode: "",
        products: preloadedProducts,
        salesPrice: `$${preloadedCalculatorData.purchaseAmount?.toLocaleString() || ''}`,
        interestRate: preloadedCalculatorData.interestRate !== undefined ? `${preloadedCalculatorData.interestRate}%` : "",
        promotionalTerm: preloadedCalculatorData.promoTerm ? `${preloadedCalculatorData.promoTerm} months` : "",
        amortization: preloadedCalculatorData.amortizationPeriod ? `${preloadedCalculatorData.amortizationPeriod} months` : "",
        monthlyPayment: monthlyPayment,
      };
    }
    
    // Always start with blank form - no localStorage loading
    return {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      products: [],
      salesPrice: "",
      interestRate: "",
      promotionalTerm: "",
      amortization: "",
      monthlyPayment: "",
    };
  });

  // No longer save form data to localStorage - each session starts fresh

  // Calculate monthly payment using same logic as Invoice Generator
  // Sales price is the base price (before admin fee), but loan amount includes admin fee
  useEffect(() => {
    const { salesPrice, interestRate, amortization } = formData;
    if (salesPrice && interestRate && amortization) {
      const basePrincipal = parseFloat(salesPrice.replace(/[^0-9.]/g, ""));
      const rate = parseFloat(interestRate.replace("%", ""));
      const months = parseInt(amortization.replace(/\D/g, ""));
      
      if (basePrincipal > 0 && months > 0) {
        // Use the same calculation as invoice generator - loan amount includes admin fee
        const loanAmount = calculateLoanAmount(basePrincipal);
        const payment = calculateMonthlyPayment(loanAmount, rate, months);
        setFormData(prev => ({
          ...prev,
          monthlyPayment: payment.toFixed(2)
        }));
      }
    }
  }, [formData.salesPrice, formData.interestRate, formData.amortization]);

  const handleInputChange = (field, value) => {
    // Apply formatting based on field type
    let formattedValue = value;
    if (['firstName', 'lastName', 'address', 'city'].includes(field)) {
      formattedValue = capitalizeWords(value);
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleProductToggle = (product) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const agentId = localStorage.getItem("agentId");
    if (!agentId) {
      toast.error("Agent ID not found. Please log in again.");
      navigate("/");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || 
        !formData.address || !formData.city || !formData.province || 
        !formData.postalCode || formData.products.length === 0 || !formData.salesPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        agentId,
        tenantSlug: tenant?.slug || 'georges',
        tenantId: tenant?.id || null, // Pass tenant ID for customer creation
        customerId: preloadedCustomer?.id || null, // Pass customer ID if editing existing
        firstName: formData.firstName,
        lastName: formData.lastName,
        customerName: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
        email: formData.email,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        products: formData.products,
        salesPrice: formData.salesPrice,
        interestRate: formData.interestRate,
        promotionalTerm: formData.promotionalTerm,
        amortization: formData.amortization,
        monthlyPayment: formData.monthlyPayment,
      };

      const { data, error } = await supabase.functions.invoke("initiate-tpv-call", {
        body: payload,
      });

      if (error) throw error;

      toast.success("TPV call initiated successfully!");
    } catch (error) {
      console.error("Error initiating TPV call:", error);
      toast.error(error.message || "Failed to initiate TPV call");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">
            TPV Request
          </h1>
          <div className="w-8 md:w-16" /> {/* Spacer for centering */}
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              TPV Request Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <InputMask
                      mask="(999) 999-9999"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    >
                      {(inputProps) => (
                        <Input
                          {...inputProps}
                          id="phoneNumber"
                          placeholder="(416) 555-1234"
                        />
                      )}
                    </InputMask>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Toronto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) => handleInputChange("province", value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {canadianProvinces.map((prov) => (
                          <SelectItem key={prov.value} value={prov.value}>
                            {prov.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal *</Label>
                    <InputMask
                      mask="a9a 9a9"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value.toUpperCase())}
                    >
                      {(inputProps) => (
                        <Input
                          {...inputProps}
                          id="postalCode"
                          placeholder="M5V 1A1"
                          className="uppercase"
                        />
                      )}
                    </InputMask>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Products *</h3>
                {productGroups.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">{group.label}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {group.products.map((product) => (
                        <div key={product} className="flex items-center space-x-2">
                          <Checkbox
                            id={product}
                            checked={formData.products.includes(product)}
                            onCheckedChange={() => handleProductToggle(product)}
                          />
                          <Label htmlFor={product} className="text-sm cursor-pointer">
                            {product}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financing Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="salesPrice">Sales Price *</Label>
                    <Input
                      id="salesPrice"
                      value={formData.salesPrice}
                      onChange={(e) => handleInputChange("salesPrice", e.target.value)}
                      placeholder="$5,000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate</Label>
                    <Select
                      value={formData.interestRate}
                      onValueChange={(value) => handleInputChange("interestRate", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {interestRates.map((rate) => (
                          <SelectItem key={rate} value={rate}>
                            {rate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promotionalTerm">Promo Term</Label>
                    <Select
                      value={formData.promotionalTerm}
                      onValueChange={(value) => handleInputChange("promotionalTerm", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Term" />
                      </SelectTrigger>
                      <SelectContent>
                        {promotionalTerms.map((term) => (
                          <SelectItem key={term} value={term}>
                            {term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amortization">Amortization</Label>
                    <Select
                      value={formData.amortization}
                      onValueChange={(value) => handleInputChange("amortization", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {amortizationPeriods.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPayment">Monthly Pay</Label>
                    <Input
                      id="monthlyPayment"
                      value={formData.monthlyPayment ? `$${formData.monthlyPayment}` : ""}
                      readOnly
                      className="bg-muted"
                      placeholder="Auto"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? "Initiating Call..." : "Initiate TPV Call"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TPVRequest;
