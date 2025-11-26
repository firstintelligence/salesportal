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

const hvacProducts = [
  "Air Conditioner",
  "Furnace",
  "Heat Pump",
  "Water Heater",
  "Tankless Water Heater",
  "Boiler",
  "Air Handler",
  "Ductless Mini Split",
  "Thermostat",
  "Air Purifier",
  "Humidifier",
  "Dehumidifier",
  "UV Light",
  "Duct Cleaning",
  "Maintenance Plan",
];

const interestRates = [
  "0.00%", "4.99%", "5.99%", "6.99%", "7.99%", "8.99%", "9.99%", 
  "10.99%", "11.99%", "12.99%", "13.99%", "14.99%"
];

const promotionalTerms = [
  "No Promo", "3 months", "6 months", "12 months", "18 months", "24 months"
];

const amortizationPeriods = [
  "60 months", "72 months", "84 months", "96 months", 
  "108 months", "120 months", "144 months", "180 months"
];

const TPVRequest = ({ onBack }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => {
    // Restore form data from localStorage if available
    const saved = localStorage.getItem("tpvFormData");
    return saved ? JSON.parse(saved) : {
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

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("tpvFormData", JSON.stringify(formData));
  }, [formData]);

  // Calculate monthly payment when relevant fields change
  useEffect(() => {
    const { salesPrice, interestRate, amortization } = formData;
    if (salesPrice && interestRate && amortization) {
      const principal = parseFloat(salesPrice.replace(/[^0-9.]/g, ""));
      const rate = parseFloat(interestRate.replace("%", "")) / 100 / 12;
      const months = parseInt(amortization.replace(/\D/g, ""));
      
      if (principal > 0 && months > 0) {
        let payment;
        if (rate === 0) {
          payment = principal / months;
        } else {
          payment = (principal * rate * Math.pow(1 + rate, months)) / 
                    (Math.pow(1 + rate, months) - 1);
        }
        setFormData(prev => ({
          ...prev,
          monthlyPayment: payment.toFixed(2)
        }));
      }
    }
  }, [formData.salesPrice, formData.interestRate, formData.amortization]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        assistantId: "33a8b0b6-2fc0-4f1f-9f01-02712d52a676",
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {canadianProvinces.map((prov) => (
                          <SelectItem key={prov.value} value={prov.value}>
                            {prov.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hvacProducts.map((product) => (
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

              {/* Financing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financing Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salesPrice">Sales Price *</Label>
                    <Input
                      id="salesPrice"
                      value={formData.salesPrice}
                      onChange={(e) => handleInputChange("salesPrice", e.target.value)}
                      placeholder="$5,000.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate</Label>
                    <Select
                      value={formData.interestRate}
                      onValueChange={(value) => handleInputChange("interestRate", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rate" />
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="promotionalTerm">Promotional Term</Label>
                    <Select
                      value={formData.promotionalTerm}
                      onValueChange={(value) => handleInputChange("promotionalTerm", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
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
                    <Label htmlFor="amortization">Amortization Period</Label>
                    <Select
                      value={formData.amortization}
                      onValueChange={(value) => handleInputChange("amortization", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
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
                    <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                    <Input
                      id="monthlyPayment"
                      value={formData.monthlyPayment ? `$${formData.monthlyPayment}` : ""}
                      readOnly
                      className="bg-muted"
                      placeholder="Calculated automatically"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
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
