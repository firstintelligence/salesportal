import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import FloatingLabelInput from '../components/FloatingLabelInput';
import BillToSection from '../components/BillToSection';
import ShipToSection from '../components/ShipToSection';
import ItemDetails from "../components/ItemDetails";
import FinancingSection from "../components/FinancingSection";
import InvoiceTemplate from "../components/InvoiceTemplate";
import RebatesSection from "../components/RebatesSection";
import FullscreenSignaturePad from "../components/FullscreenSignaturePad";
import { templates } from "../utils/templateRegistry";
import { generatePDF } from "../utils/pdfGenerator";
import { Button } from "@/components/ui/button";
import { FiEdit, FiFileText, FiTrash2 } from "react-icons/fi"; 
import { RefreshCw, Loader2, Pen, Save } from "lucide-react";
import { addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { generateInvoiceNumber, getProvincialTax, calculateLoanAmount, calculateMonthlyPayment } from "../utils/financingCalculations";
import { supabase } from "@/integrations/supabase/client";
import { getSimplifiedProductList } from "../utils/productNameSimplifier";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantCompanyInfo, getTenantLogo } from "@/utils/tenantLogos";
import { formatPhoneNumber } from "@/utils/inputFormatting";

// Helper function to get province tax name
const getProvinceTaxName = (provinceCode) => {
  const taxNames = {
    'AB': 'GST',      // Alberta - GST only
    'BC': 'HST',      // British Columbia - HST
    'MB': 'GST+PST',  // Manitoba - GST + PST
    'NB': 'HST',      // New Brunswick - HST
    'NL': 'HST',      // Newfoundland and Labrador - HST
    'NS': 'HST',      // Nova Scotia - HST
    'NT': 'GST',      // Northwest Territories - GST only
    'NU': 'GST',      // Nunavut - GST only
    'ON': 'HST',      // Ontario - HST
    'PE': 'HST',      // Prince Edward Island - HST
    'QC': 'GST+QST',  // Quebec - GST + QST
    'SK': 'GST+PST',  // Saskatchewan - GST + PST
    'YT': 'GST'       // Yukon - GST only
  };
  
  return taxNames[provinceCode] || 'HST';
};

const generateRandomInvoiceNumber = () => {
  const length = Math.floor(Math.random() * 6) + 3;
  const alphabetCount = Math.min(Math.floor(Math.random() * 4), length);
  let result = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  for (let i = 0; i < alphabetCount; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  for (let i = alphabetCount; i < length; i++) {
    result += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return result;
};

const noteOptions = [
  "Thank you for choosing us today! We hope your shopping experience was pleasant and seamless. Your satisfaction matters to us, and we look forward to serving you again soon. Keep this receipt for any returns or exchanges.",
  "Your purchase supports our community! We believe in giving back and working towards a better future. Thank you for being a part of our journey. We appreciate your trust and hope to see you again soon.",
  "We value your feedback! Help us improve by sharing your thoughts on the text message survey link. Your opinions help us serve you better and improve your shopping experience. Thank you for shopping with us!",
  "Did you know you can save more with our loyalty program? Ask about it on your next visit and earn points on every purchase. It’s our way of saying thank you for being a loyal customer. See you next time!",
  "Need assistance with your purchase? We’re here to help! Reach out to our customer support, or visit our website for more information. We’re committed to providing you with the best service possible.",
  "Keep this receipt for returns or exchanges.",
  "Every purchase makes a difference! We are dedicated to eco-friendly practices and sustainability. Thank you for supporting a greener planet with us. Together, we can build a better tomorrow.",
  "Have a great day!",
  "“Thank you for shopping with us today. Did you know you can return or exchange your items within 30 days with this receipt? We want to ensure that you’re happy with your purchase, so don’t hesitate to come back if you need assistance.",
  "Eco-friendly business. This receipt is recyclable.",
  "We hope you enjoyed your shopping experience! Remember, for every friend you refer, you can earn exclusive rewards. Visit www.example.com/refer for more details. We look forward to welcoming you back soon!",
  "Thank you for choosing us! We appreciate your business and look forward to serving you again. Keep this receipt for any future inquiries or returns.",
  "Your purchase supports local businesses and helps us continue our mission. Thank you for being a valued customer. We hope to see you again soon!",
  "We hope you had a great shopping experience today. If you have any feedback, please share it with us on our website. We are always here to assist you.",
  "Thank you for your visit! Remember, we offer exclusive discounts to returning customers. Check your email for special offers on your next purchase.",
  "Your satisfaction is our top priority. If you need any help or have questions about your purchase, don’t hesitate to contact us. Have a great day!",
  "We love our customers! Thank you for supporting our business. Follow us on social media for updates on promotions and new products. See you next time!",
  "Every purchase counts! We are committed to making a positive impact, and your support helps us achieve our goals. Thank you for shopping with us today!",
  "We hope you found everything you needed. If not, please let us know so we can improve your experience. Your feedback helps us serve you better. Thank you!",
  "Thank you for visiting! Did you know you can save more with our rewards program? Ask about it during your next visit and start earning points today!",
  "We appreciate your trust in us. If you ever need assistance with your order, please visit our website or call customer service. We’re here to help!",
];

const Index = ({ preloadedCustomer, preloadedInvoiceProfile, preloadedCalculatorData }) => {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading } = useTenant();
  
  // Track whether we've already loaded initial form data to avoid overwriting user input
  const hasLoadedInitialData = useRef(false);
  
  // CRITICAL: Don't render anything until tenant is fully loaded to prevent cross-tenant data exposure
  const tenantSlug = tenant?.slug;
  const tenantCompanyInfo = tenantSlug ? getTenantCompanyInfo(tenantSlug) : null;
  const tenantLogo = tenantSlug ? getTenantLogo(tenantSlug) : null;
  
  // Tenant-specific localStorage key to ensure complete data isolation
  const formDataKey = tenantSlug ? `formData_${tenantSlug}` : null;
  
  const [billTo, setBillTo] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    phone: "", 
    address: "", 
    city: "", 
    province: "", 
    postalCode: "",
    coApplicantName: "",
    coApplicantPhone: ""
  });
  const [shipTo, setShipTo] = useState({ name: "", address: "", phone: "" });
  
  // Get today's date in Toronto timezone - computed once on mount
  const [invoice, setInvoice] = useState(() => {
    const torontoTime = toZonedTime(new Date(), 'America/Toronto');
    const todayFormatted = format(torontoTime, 'yyyy-MM-dd');
    const dueDateFormatted = format(addDays(torontoTime, 7), 'yyyy-MM-dd');
    return {
      date: todayFormatted,
      paymentDate: dueDateFormatted,
      number: "",
    };
  });
  const [financing, setFinancing] = useState(() => ({
    financeCompany: "Financeit Canada Inc.",
    loanAmount: preloadedCalculatorData?.loanAmount || 0,
    amortizationPeriod: preloadedCalculatorData?.amortizationPeriod || 180,
    loanTerm: preloadedCalculatorData?.promoTerm || 24,
    interestRate: preloadedCalculatorData?.interestRate || 0
  }));
  const [rebatesIncentives, setRebatesIncentives] = useState({
    federalRebate: 0,
    provincialRebate: 0,
    utilityRebate: 0,
    manufacturerRebate: 0
  });
  const [yourCompany, setYourCompany] = useState({
    name: tenantCompanyInfo?.name || "",
    address: tenantCompanyInfo?.address || "",
    phone: tenantCompanyInfo?.phone || "",
    email: tenantCompanyInfo?.email || "",
    logo: tenantLogo || null
  });
  const [items, setItems] = useState(() => {
    if (preloadedCalculatorData?.purchaseAmount) {
      return [{ 
        id: crypto.randomUUID(), 
        quantity: 1, 
        amount: preloadedCalculatorData.purchaseAmount, 
        total: preloadedCalculatorData.purchaseAmount, 
        name: "Equipment & Installation", 
        description: "", 
        productId: "" 
      }];
    }
    return [{ id: crypto.randomUUID(), quantity: 1, amount: 0, total: 0, name: "", description: "", productId: "" }];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [taxPercentage, settaxPercentage] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [notes, setNotes] = useState("Installation includes permits, electrical connections, and system commissioning. All work performed by licensed professionals with full warranty coverage.");
  const [isInvoice, setIsInvoice] = useState(true); // Toggle for invoice vs quote - default to invoice
  const [showContractorFees, setShowContractorFees] = useState(false); // Toggle for showing contractor fees
  const [isDownloading, setIsDownloading] = useState(false); // For PDF download state
  const [selectedCurrency] = useState('CAD'); // Default currency
  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef(null);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [savedSignatureDataUrl, setSavedSignatureDataUrl] = useState(null);
  const [isCoApplicantSignaturePadOpen, setIsCoApplicantSignaturePadOpen] = useState(false);
  const [coApplicantSignatureDataUrl, setCoApplicantSignatureDataUrl] = useState(null);

  // Update company info when tenant changes
  useEffect(() => {
    if (tenant?.slug) {
      const companyInfo = getTenantCompanyInfo(tenant.slug);
      const logo = getTenantLogo(tenant.slug);
      setYourCompany({
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email,
        logo: logo
      });
    }
  }, [tenant?.slug]);

  const refreshNotes = () => {
    const randomIndex = Math.floor(Math.random() * noteOptions.length);
    setNotes(noteOptions[randomIndex]);
  };

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const horizontalPadding = 32; // p-4 left + right
      const verticalPadding = 32; // p-4 top + bottom

      const availableWidth = containerWidth - horizontalPadding;
      const availableHeight = containerHeight - verticalPadding;

      if (!availableWidth || availableWidth <= 0 || !availableHeight || availableHeight <= 0) return;

      const pageWidth = 794; // Base template width
      const pageHeight = 1123; // Base template height

      // Fit to container WIDTH only; allow vertical scrolling for height
      const widthScale = availableWidth / pageWidth;

      // Clamp to a reasonable maximum so it doesn't blow up on huge screens
      const scale = Math.min(widthScale, 1.5);
      setPreviewScale(scale);
    };

    // Run once on mount
    updateScale();

    // Recalculate whenever the container size changes
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // CRITICAL: Wait for tenant to be loaded before doing anything, and only run once
    if (!formDataKey || !tenantCompanyInfo || hasLoadedInitialData.current) return;
    
    // Mark as loaded so we don't overwrite user input on subsequent tenant changes
    hasLoadedInitialData.current = true;
    
    // Preload customer data if provided
    if (preloadedCustomer) {
      setBillTo({
        firstName: preloadedCustomer.first_name || "",
        lastName: preloadedCustomer.last_name || "",
        email: preloadedCustomer.email || "",
        phone: formatPhoneNumber(preloadedCustomer.phone) || "",
        address: preloadedCustomer.address || "",
        city: preloadedCustomer.city || "",
        province: preloadedCustomer.province || "ON",
        postalCode: preloadedCustomer.postal_code || "",
        coApplicantName: "",
        coApplicantPhone: ""
      });
      setInvoice((prev) => ({
        ...prev,
        number: generateInvoiceNumber(
          preloadedCustomer.first_name,
          preloadedCustomer.last_name,
          preloadedCustomer.phone,
          tenantCompanyInfo.invoicePrefix
        ),
      }));
      return;
    }

    // Load form data from tenant-specific localStorage key
    const savedFormData = localStorage.getItem(formDataKey);
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      const loadedBillTo = parsedData.billTo || {};
      setBillTo({ 
        firstName: loadedBillTo.firstName || "", 
        lastName: loadedBillTo.lastName || "", 
        email: loadedBillTo.email || "", 
        phone: formatPhoneNumber(loadedBillTo.phone) || "", 
        address: loadedBillTo.address || "", 
        city: loadedBillTo.city || "", 
        province: loadedBillTo.province || "ON", 
        postalCode: loadedBillTo.postalCode || "",
        coApplicantName: loadedBillTo.coApplicantName || "",
        coApplicantPhone: formatPhoneNumber(loadedBillTo.coApplicantPhone) || ""
      });
      setShipTo(parsedData.shipTo || { name: "", address: "", phone: "" });
      setInvoice(
        parsedData.invoice || { date: "", paymentDate: "", number: "" }
      );
      // ALWAYS use current tenant's company info - never load from storage
      setYourCompany({
        name: tenantCompanyInfo.name,
        address: tenantCompanyInfo.address,
        phone: tenantCompanyInfo.phone,
        email: tenantCompanyInfo.email,
        logo: tenantLogo
      });
      // Ensure all items have unique IDs for proper React reconciliation
      const loadedItems = parsedData.items || [];
      setItems(loadedItems.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID()
      })));
      const province = parsedData.billTo?.province || 'ON';
      settaxPercentage(getProvincialTax(province));
      setFinancing(parsedData.financing || {
        financeCompany: "Financeit Canada Inc.",
        loanAmount: 0,
        amortizationPeriod: 180,
        loanTerm: 24,
        interestRate: 0
      });
      setRebatesIncentives(parsedData.rebatesIncentives || {
        federalRebate: 0,
        provincialRebate: 0,
        utilityRebate: 0,
        manufacturerRebate: 0
      });
      setNotes(parsedData.notes || "Installation includes permits, electrical connections, and system commissioning. All work performed by licensed professionals with full warranty coverage.");
      setSavedSignatureDataUrl(parsedData.signature || null);
      setCoApplicantSignatureDataUrl(parsedData.coApplicantSignature || null);
      
    } else {
      // If no saved data, set default values with current tenant info
      setYourCompany({
        name: tenantCompanyInfo.name,
        address: tenantCompanyInfo.address,
        phone: tenantCompanyInfo.phone,
        email: tenantCompanyInfo.email,
        logo: tenantLogo
      });
      setInvoice((prev) => ({
        ...prev,
        number: `${tenantCompanyInfo.invoicePrefix}0000`, // Will be updated when customer info is entered
      }));
      settaxPercentage(getProvincialTax('ON')); // Default to Ontario
    }
  }, [preloadedCustomer, formDataKey, tenantCompanyInfo, tenantLogo]);

  useEffect(() => {
    // CRITICAL: Only save when tenant is loaded to prevent cross-tenant data
    if (!formDataKey) return;
    
    // Save form data to tenant-specific localStorage key
    const formData = {
      billTo,
      shipTo,
      invoice,
      // Don't save yourCompany - always use current tenant info
      items,
      taxPercentage,
      taxAmount,
      subTotal,
      grandTotal,
      financing,
      rebatesIncentives,
      notes,
      signature: savedSignatureDataUrl,
      coApplicantSignature: coApplicantSignatureDataUrl,
    };
    localStorage.setItem(formDataKey, JSON.stringify(formData));
  }, [
    formDataKey,
    billTo,
    shipTo,
    invoice,
    items,
    taxPercentage,
    notes,
    taxAmount,
    subTotal,
    grandTotal,
    financing,
    rebatesIncentives,
    savedSignatureDataUrl,
    coApplicantSignatureDataUrl,
  ]);

  const handleInputChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Auto-generate invoice number when customer info changes
      if (setter === setBillTo && (name === 'firstName' || name === 'lastName' || name === 'phone')) {
        const firstName = name === 'firstName' ? value : prev.firstName;
        const lastName = name === 'lastName' ? value : prev.lastName;
        const phone = name === 'phone' ? value : prev.phone;
        
        if (firstName && lastName && phone) {
          setInvoice(prevInvoice => ({
            ...prevInvoice,
            number: generateInvoiceNumber(firstName, lastName, phone, tenantCompanyInfo.invoicePrefix)
          }));
        }
      }
      
      // Update tax rate when province changes
      if (setter === setBillTo && name === 'province') {
        settaxPercentage(getProvincialTax(value));
      }
      
      return newData;
    });
  };

  const handleItemChange = useCallback((index, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === "quantity" || field === "amount") {
        newItems[index].total = newItems[index].quantity * newItems[index].amount;
      }
      return newItems;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: "", description: "", quantity: 1, amount: 0, total: 0, productId: "" },
    ]);
  }, []);

  const removeItem = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moveItemUp = useCallback((index) => {
    if (index > 0) {
      setItems(prev => {
        const newItems = [...prev];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        return newItems;
      });
    }
  }, []);

  const moveItemDown = useCallback((index) => {
    setItems(prev => {
      if (index < prev.length - 1) {
        const newItems = [...prev];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        return newItems;
      }
      return prev;
    });
  }, []);

  // Use useMemo for derived calculations to avoid state update cascades
  const calculatedSubTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
  }, [items]);

  const calculatedTaxAmount = useMemo(() => {
    return (calculatedSubTotal * taxPercentage) / 100;
  }, [calculatedSubTotal, taxPercentage]);

  const calculatedGrandTotal = useMemo(() => {
    return calculatedSubTotal + calculatedTaxAmount;
  }, [calculatedSubTotal, calculatedTaxAmount]);

  // Sync derived values to state for components that need them
  useEffect(() => {
    setSubTotal(calculatedSubTotal);
    setTaxAmount(calculatedTaxAmount);
    setGrandTotal(calculatedGrandTotal);
  }, [calculatedSubTotal, calculatedTaxAmount, calculatedGrandTotal]);

  const handleTaxPercentageChange = (e) => {
    const taxRate = parseFloat(e.target.value) || 0;
    settaxPercentage(taxRate);
  };

  // Auto-set payment date to 7 days after invoice date - only update paymentDate, not the whole invoice
  const handleDateChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'date' && value) {
      const paymentDate = addDays(new Date(value), 7);
      setInvoice(prev => ({
        ...prev,
        date: value,
        paymentDate: format(paymentDate, 'yyyy-MM-dd')
      }));
    } else {
      setInvoice(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  // Update financing loan amount when grand total changes
  useEffect(() => {
    const loanAmount = calculateLoanAmount(calculatedGrandTotal);
    setFinancing(prev => ({
      ...prev,
      loanAmount
    }));
  }, [calculatedGrandTotal]);

  const handleTemplateClick = (templateNumber) => {
    const formData = {
      billTo,
      shipTo,
      invoice,
      yourCompany,
      items,
      taxPercentage,
      taxAmount,
      subTotal,
      grandTotal,
      financing,
      rebatesIncentives,
      notes,
      isInvoice,
    };
    navigate("/template", {
      state: { formData, selectedTemplate: templateNumber },
    });
  };

  const fillDummyData = () => {
    setBillTo({
      firstName: "John",
      lastName: "Doe", 
      email: "john.doe@email.com",
      phone: "5551234567",
      address: "123 Main St",
      city: "Toronto",
      province: "ON",
      postalCode: "M5V 3A3"
    });
    setShipTo({
      name: "Jane Smith",
      address: "456 Elm St, Othertown, USA",
      phone: "(555) 987-6543",
    });
    setInvoice({
      date: new Date().toISOString().split("T")[0],
      paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      number: generateRandomInvoiceNumber(),
    });
    setYourCompany({
      name: "Your Company",
      address: "789 Oak St, Businessville, USA",
      phone: "(555) 555-5555",
    });
    setItems([
      {
        name: "Residential Heat Pump - Premium",
        description: "High-efficiency heat pump system for residential use (16 SEER)",
        quantity: 1,
        amount: 15500,
        total: 15500,
        productId: "heat-pump-residential-premium"
      },
      {
        name: "Smart Thermostat",
        description: "Wi-Fi enabled smart thermostat with app control", 
        quantity: 1,
        amount: 850,
        total: 850,
        productId: "thermostat-smart"
      }
    ]);
    settaxPercentage(getProvincialTax("ON"));
    setNotes("Thank you for choosing George's Plumbing and Heating!");
  };

  const clearForm = () => {
    // Get today's date and due date (7 days later)
    const today = getTodayInToronto();
    const dueDate = format(addDays(new Date(today), 7), 'yyyy-MM-dd');
    
    // Reset the hasLoadedInitialData flag so the form doesn't try to reload old data
    hasLoadedInitialData.current = false;
    
    setBillTo({ 
      firstName: "", 
      lastName: "", 
      email: "", 
      phone: "", 
      address: "", 
      city: "", 
      province: "ON", 
      postalCode: "",
      coApplicantName: "",
      coApplicantPhone: ""
    });
    setShipTo({ name: "", address: "", phone: "" });
    setInvoice({
      date: today,
      paymentDate: dueDate,
      number: `${tenantCompanyInfo.invoicePrefix}0000`,
    });
    setYourCompany({
      name: tenantCompanyInfo.name,
      address: tenantCompanyInfo.address,
      phone: tenantCompanyInfo.phone,
      email: tenantCompanyInfo.email,
      logo: tenantLogo
    });
    setItems([{ id: crypto.randomUUID(), name: "", description: "", quantity: 1, amount: 0, total: 0, productId: "" }]);
    settaxPercentage(getProvincialTax("ON"));
    setFinancing({
      financeCompany: "Financeit Canada Inc.",
      loanAmount: 0,
      amortizationPeriod: 180,
      loanTerm: 24,
      interestRate: 0
    });
    setRebatesIncentives({
      federalRebate: 0,
      provincialRebate: 0,
      utilityRebate: 0,
      manufacturerRebate: 0
    });
    setNotes("");
    setSavedSignatureDataUrl(null);
    setCoApplicantSignatureDataUrl(null);
    if (formDataKey) {
      localStorage.removeItem(formDataKey);
    }
    
    // Mark as loaded again so we don't accidentally overwrite with stale localStorage
    hasLoadedInitialData.current = true;
  };

  // Save customer profile to dashboard
  const handleSaveToDashboard = async () => {
    // Validate required fields
    if (!billTo.firstName || !billTo.lastName || !billTo.phone || !billTo.address) {
      toast.error("Please fill in customer name, phone, and address before saving");
      return;
    }

    setIsSaving(true);
    try {
      const agentId = localStorage.getItem("agentId");
      if (!agentId) {
        toast.error("Please login to save customer profiles");
        return;
      }

      // Create or update customer with tenant_id and agent_id
      const customerData = {
        first_name: billTo.firstName,
        last_name: billTo.lastName,
        email: billTo.email || null,
        phone: billTo.phone,
        address: billTo.address,
        city: billTo.city || null,
        province: billTo.province || 'ON',
        postal_code: billTo.postalCode || null,
        tenant_id: tenant?.id || null, // CRITICAL: Associate with current tenant
        agent_id: agentId, // Track which agent created this customer
      };

      // Check if customer exists by phone number within the same tenant
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", billTo.phone)
        .eq("tenant_id", tenant?.id)
        .single();

      let customerId;
      if (existingCustomer) {
        // Update existing customer
        const { error: updateError } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", existingCustomer.id);
        
        if (updateError) throw updateError;
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert(customerData)
          .select("id")
          .single();
        
        if (insertError) throw insertError;
        customerId = newCustomer.id;
      }

      // Get simplified product list for TPV
      const simplifiedProducts = getSimplifiedProductList(items);

      // Create TPV request with invoice data (draft status)
      const tpvData = {
        customer_id: customerId,
        tenant_id: tenant?.id || null, // CRITICAL: Associate with current tenant
        agent_id: agentId,
        customer_name: `${billTo.firstName} ${billTo.lastName}`,
        first_name: billTo.firstName,
        last_name: billTo.lastName,
        customer_phone: billTo.phone,
        customer_address: billTo.address,
        city: billTo.city || null,
        province: billTo.province || 'ON',
        postal_code: billTo.postalCode || null,
        email: billTo.email || null,
        products: simplifiedProducts,
        sales_price: grandTotal.toString(),
        interest_rate: financing.interestRate?.toString() || null,
        promotional_term: financing.loanTerm?.toString() || null,
        amortization: financing.amortizationPeriod?.toString() || null,
        monthly_payment: financing.loanAmount ? calculateMonthlyPayment(
          financing.loanAmount,
          financing.interestRate || 0,
          financing.amortizationPeriod
        ).toString() : null,
        status: 'draft'
      };

      // Check if draft TPV exists for this customer
      const { data: existingTpv } = await supabase
        .from("tpv_requests")
        .select("id")
        .eq("customer_id", customerId)
        .eq("status", "draft")
        .single();

      if (existingTpv) {
        await supabase
          .from("tpv_requests")
          .update(tpvData)
          .eq("id", existingTpv.id);
      } else {
        await supabase
          .from("tpv_requests")
          .insert(tpvData);
      }

      // Store invoice data in localStorage for prefilling other tools
      const invoiceProfile = {
        customerId,
        billTo,
        items,
        financing,
        grandTotal,
        subTotal,
        taxAmount,
        taxPercentage,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`invoice_profile_${tenantSlug}_${customerId}`, JSON.stringify(invoiceProfile));

      toast.success("Customer profile saved to dashboard!");
      
      // Navigate to customer detail page
      navigate(`/customer/${customerId}`);

    } catch (error) {
      console.error("Error saving to dashboard:", error);
      toast.error("Failed to save customer profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!isDownloading) {
      setIsDownloading(true);
      try {
        const formData = {
          invoice,
          billTo,
          shipTo,
          items,
          financing,
          rebatesIncentives,
          yourCompany,
          isInvoice,
          subTotal,
          grandTotal,
          taxAmount,
          taxPercentage,
          notes,
          selectedCurrency,
          signature: savedSignatureDataUrl,
          coApplicantSignature: coApplicantSignatureDataUrl
        };
        await generatePDF(formData, 4, tenantSlug); // Using template 4
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  // CRITICAL: Block rendering until tenant is fully loaded to prevent any cross-tenant data flash
  if (tenantLoading || !tenantSlug || !tenantCompanyInfo) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0 flex gap-2">
          <button
            onClick={clearForm}
            className="bg-red-500 text-white px-3 py-2 rounded-full shadow-lg hover:bg-red-600 flex items-center gap-2"
            aria-label="Clear Invoice"
          >
            <FiTrash2 size={20} />
            <span className="hidden sm:inline text-sm font-medium">Clear</span>
          </button>
          <button
            onClick={handleSaveToDashboard}
            disabled={isSaving}
            className="bg-green-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Save Invoice"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline text-sm font-medium">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Save</span>
              </>
            )}
          </button>
        </div>
        <h1 className="text-3xl font-bold">{isInvoice ? 'Invoice Generator' : 'Quote Generator'}</h1>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-md order-1 lg:order-1">
          <form>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  {isInvoice ? 'Invoice' : 'Quote'} Information
                </h2>
                <div className="flex items-center gap-2">
                  <span className={!isInvoice ? 'font-semibold' : ''}>Quote</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isInvoice}
                      onChange={(e) => setIsInvoice(e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={isInvoice ? 'font-semibold' : ''}>Invoice</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingLabelInput
                  id="invoiceNumber"
                  label={`${isInvoice ? 'Invoice' : 'Quote'} Number`}
                  value={invoice.number}
                  onChange={handleInputChange(setInvoice)}
                  name="number"
                />
                <FloatingLabelInput
                  id="invoiceDate"
                  label={`${isInvoice ? 'Invoice' : 'Quote'} Date`}
                  type="date"
                  value={invoice.date}
                  onChange={handleDateChange}
                  name="date"
                />
                <FloatingLabelInput
                  id="paymentDate"
                  label={isInvoice ? 'Due Date' : 'Valid Until'}
                  type="date"
                  value={invoice.paymentDate}
                  disabled
                  name="paymentDate"
                />
              </div>
            </div>

            <BillToSection
              billTo={billTo}
              handleInputChange={handleInputChange(setBillTo)}
            />
            <ItemDetails
              items={items}
              handleItemChange={handleItemChange}
              addItem={addItem}
              removeItem={removeItem}
              moveItemUp={moveItemUp}
              moveItemDown={moveItemDown}
            />
            {/* Totals section - sleeker and low profile */}
            <div className="mb-4 bg-gray-50/50 px-3 py-2 rounded-md">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sub Total:</span>
                  <span className="font-medium">${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({taxPercentage}% {getProvinceTaxName(billTo.province)}):</span>
                  <span className="font-medium">${taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span>${grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 items-stretch">
              <FinancingSection
                financing={financing} 
                setFinancing={setFinancing} 
                invoiceAmount={subTotal}
                showContractorFees={showContractorFees}
                setShowContractorFees={setShowContractorFees}
              />

              <RebatesSection 
                rebatesIncentives={rebatesIncentives} 
                setRebatesIncentives={setRebatesIncentives} 
                 
              />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Customer Signature</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-4 min-h-[120px] flex items-center justify-center bg-muted/30">
                {savedSignatureDataUrl ? (
                  <div className="relative w-full">
                    <img 
                      src={savedSignatureDataUrl} 
                      alt="Customer Signature" 
                      className="max-h-[100px] mx-auto"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSignaturePadOpen(true)}
                      className="absolute top-0 right-0"
                    >
                      <Pen className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSignaturePadOpen(true)}
                  >
                    <Pen className="h-4 w-4 mr-2" />
                    Add Signature
                  </Button>
                )}
              </div>
            </div>

            {billTo.coApplicantName && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Co-Applicant Signature</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-4 min-h-[120px] flex items-center justify-center bg-muted/30">
                  {coApplicantSignatureDataUrl ? (
                    <div className="relative w-full">
                      <img 
                        src={coApplicantSignatureDataUrl} 
                        alt="Co-Applicant Signature" 
                        className="max-h-[100px] mx-auto"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCoApplicantSignaturePadOpen(true)}
                        className="absolute top-0 right-0"
                      >
                        <Pen className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCoApplicantSignaturePadOpen(true)}
                    >
                      <Pen className="h-4 w-4 mr-2" />
                      Add Signature
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-medium">Notes</h3>
                <button
                  type="button"
                  onClick={refreshNotes}
                  className="ml-2 p-1 rounded-full hover:bg-gray-200"
                  title="Refresh Notes"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded"
                rows="4"
              ></textarea>
            </div>

            {/* Clear Form button removed */}
          </form>

          <FullscreenSignaturePad
            isOpen={isSignaturePadOpen}
            onClose={() => setIsSignaturePadOpen(false)}
            onSave={(signatureDataUrl) => setSavedSignatureDataUrl(signatureDataUrl)}
            initialSignature={savedSignatureDataUrl}
          />
          
          <FullscreenSignaturePad
            isOpen={isCoApplicantSignaturePadOpen}
            onClose={() => setIsCoApplicantSignaturePadOpen(false)}
            onSave={(signatureDataUrl) => setCoApplicantSignatureDataUrl(signatureDataUrl)}
            initialSignature={coApplicantSignatureDataUrl}
          />
        </div>

        <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-md order-2 lg:order-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-2xl font-semibold">{isInvoice ? 'Invoice Preview' : 'Quote Preview'}</h2>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  'Download PDF'
                )}
              </Button>
            </div>
          </div>
          <div className="w-full overflow-hidden">
            <div
              ref={previewContainerRef}
              className="bg-gray-200 rounded border border-gray-400 overflow-y-auto overflow-x-hidden max-h-[800px] w-full"
            >
              <div className="p-4 w-full flex flex-col items-center gap-6">
                {(() => {
                  const pageHeight = 1123; // US Letter height (11 inches at 72 DPI)
                  const pageWidth = 794; // US Letter width (8.5 inches at 72 DPI)
                  
                  // Estimate content height more accurately
                  const headerHeight = 180;
                  const itemRowHeight = 65;
                  const financingHeight = financing?.loanAmount ? 170 : 0;
                  const rebatesHeight = (rebatesIncentives && Object.values(rebatesIncentives).some(value => value > 0)) ? 120 : 0;
                  const summaryHeight = 100;
                  const notesHeight = notes ? 80 : 0;
                  const footerHeight = 150;
                  
                  const totalContentHeight = headerHeight + (items.length * itemRowHeight) + 
                                            financingHeight + rebatesHeight + summaryHeight + 
                                            notesHeight + footerHeight;
                  
                  const numberOfPages = Math.max(1, Math.ceil(totalContentHeight / pageHeight));
                  
                  return Array.from({ length: numberOfPages }, (_, pageIndex) => {
                    const scaledWidth = pageWidth * previewScale;
                    const scaledHeight = pageHeight * previewScale;

                    return (
                      <div key={pageIndex} className="relative">
                        {/* Page container with shadow and border for visual separation */}
                        <div 
                          className="relative bg-white shadow-xl border border-gray-300 rounded-sm" 
                          style={{ 
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                          }}
                        >
                          <div
                            className="origin-top-left"
                            style={{
                              width: `${pageWidth}px`,
                              height: `${pageHeight}px`,
                              transform: `scale(${previewScale})`,
                            }}
                          >
                            <InvoiceTemplate
                              data={{
                                invoice,
                                billTo,
                                shipTo,
                                items,
                                financing,
                                rebatesIncentives,
                                yourCompany,
                                isInvoice,
                                subTotal,
                                grandTotal,
                                taxAmount,
                                taxPercentage,
                                notes,
                                selectedCurrency,
                                pageNumber: pageIndex + 1,
                                totalPages: numberOfPages,
                                signature: savedSignatureDataUrl,
                                coApplicantSignature: coApplicantSignatureDataUrl,
                              }}
                              templateNumber={4}
                            />
                          </div>
                          {/* Page indicator - only show if multiple pages */}
                          {numberOfPages > 1 && (
                            <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                              Page {pageIndex + 1} of {numberOfPages}
                            </div>
                          )}
                        </div>
                        {/* Page separator label */}
                        {pageIndex < numberOfPages - 1 && (
                          <div className="flex items-center justify-center py-2 mt-4">
                            <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                            <span className="px-3 text-xs font-medium text-gray-500 bg-gray-200">PAGE BREAK</span>
                            <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
