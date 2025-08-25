import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import FloatingLabelInput from '../components/FloatingLabelInput';
import BillToSection from '../components/BillToSection';
import ShipToSection from '../components/ShipToSection';
import ItemDetails from "../components/ItemDetails";
import FinancingSection from "../components/FinancingSection";
import InvoiceTemplate from "../components/InvoiceTemplate";
import RebatesSection from "../components/RebatesSection";
import { templates } from "../utils/templateRegistry";
import { generatePDF } from "../utils/pdfGenerator";
import { Button } from "@/components/ui/button";
import { FiEdit, FiFileText, FiTrash2 } from "react-icons/fi"; 
import { RefreshCw, Loader2 } from "lucide-react";
import { addDays } from "date-fns";
import { generateInvoiceNumber, getProvincialTax, calculateLoanAmount, calculateMonthlyPayment } from "../utils/financingCalculations";

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

const Index = () => {
  const navigate = useNavigate();
  
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
  const [invoice, setInvoice] = useState({
    date: "",
    paymentDate: "",
    number: "",
  });
  const [financing, setFinancing] = useState({
    financeCompany: "Financeit Canada Inc.",
    loanAmount: 0,
    amortizationPeriod: 180,
    loanTerm: 24,
    interestRate: 0
  });
  const [rebatesIncentives, setRebatesIncentives] = useState({
    federalRebate: 0,
    provincialRebate: 0,
    utilityRebate: 0,
    manufacturerRebate: 0
  });
  const [yourCompany, setYourCompany] = useState({
    name: "George's Plumbing and Heating",
    address: "14 Rathmine Street, London, ON N5Z 1Z3",
    phone: "(519) 555-0123",
    email: "info@georgesplumbingandheating.ca",
  });
  const [items, setItems] = useState([
    { quantity: 1, amount: 0, total: 0, name: "", description: "", productId: "" }
  ]);
  const [taxPercentage, settaxPercentage] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [notes, setNotes] = useState("Installation includes permits, electrical connections, and system commissioning. All work performed by licensed professionals with full warranty coverage.");
  const [isInvoice, setIsInvoice] = useState(false); // Toggle for invoice vs quote
  const [showContractorFees, setShowContractorFees] = useState(false); // Toggle for showing contractor fees
  const [isDownloading, setIsDownloading] = useState(false); // For PDF download state
  const [selectedCurrency] = useState('CAD'); // Default currency

  const refreshNotes = () => {
    const randomIndex = Math.floor(Math.random() * noteOptions.length);
    setNotes(noteOptions[randomIndex]);
  };

  useEffect(() => {
    // Load form data from localStorage on component mount
    const savedFormData = localStorage.getItem("formData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setBillTo(parsedData.billTo || { 
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
      setShipTo(parsedData.shipTo || { name: "", address: "", phone: "" });
      setInvoice(
        parsedData.invoice || { date: "", paymentDate: "", number: "" }
      );
      setYourCompany(
        parsedData.yourCompany || { 
          name: "George's Plumbing and Heating",
          address: "14 Rathmine Street, London, ON N5Z 1Z3",
          phone: "(519) 555-0123",
          email: "info@georgesplumbingandheating.ca"
        }
      );
      setItems(parsedData.items || []);
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
      
    } else {
      // If no saved data, set default values
      setInvoice((prev) => ({
        ...prev,
        number: "GPH0000", // Will be updated when customer info is entered
      }));
      settaxPercentage(getProvincialTax('ON')); // Default to Ontario
    }
  }, []);

  useEffect(() => {
    // Save form data to localStorage whenever it changes
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
    };
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [
    billTo,
    shipTo,
    invoice,
    yourCompany,
    items,
    taxPercentage,
    notes,
    taxAmount,
    subTotal,
    grandTotal,
    financing,
    rebatesIncentives,
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
            number: generateInvoiceNumber(firstName, lastName, phone)
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "quantity" || field === "amount") {
      newItems[index].total = newItems[index].quantity * newItems[index].amount;
    }
    setItems(newItems);
    updateTotals();
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", description: "", quantity: 1, amount: 0, total: 0, productId: "" },
    ]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateSubTotal = () => {
    const calculatedSubTotal = items.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
    setSubTotal(calculatedSubTotal); // Store as number
    return calculatedSubTotal;
  };

  const calculateTaxAmount = (subTotalValue) => { // Renamed param to avoid conflict with state
    const tax = (subTotalValue * taxPercentage) / 100;
    setTaxAmount(tax); // Store as number
    return tax;
  };

  const calculateGrandTotal = (subTotalValue, taxAmountValue) => { // Renamed params to avoid conflict with state
    const total = parseFloat(subTotalValue) + parseFloat(taxAmountValue);
    setGrandTotal(total); // Store as number
    return total;
  };

  const updateTotals = () => {
    const currentSubTotal = calculateSubTotal();
    const currentTaxAmount = calculateTaxAmount(currentSubTotal);
    // setGrandTotal will be called by calculateGrandTotal via currentTaxAmount's setter,
    // or directly if we prefer explicit calls.
    // For clarity and directness, let's call it explicitly here.
    calculateGrandTotal(currentSubTotal, currentTaxAmount);
    // Note: setSubTotal and setTaxAmount are called within their respective calculate functions.
  };

  const handleTaxPercentageChange = (e) => {
    const taxRate = parseFloat(e.target.value) || 0;
    settaxPercentage(taxRate);
    // updateTotals will be called by the useEffect listening to taxPercentage change
  };

  // Auto-set payment date to 7 days after invoice date
  useEffect(() => {
    if (invoice.date) {
      const paymentDate = addDays(new Date(invoice.date), 7);
      setInvoice(prev => ({
        ...prev,
        paymentDate: paymentDate.toISOString().split('T')[0]
      }));
    }
  }, [invoice.date]);

  // Update financing loan amount when grand total changes
  useEffect(() => {
    const loanAmount = calculateLoanAmount(grandTotal);
    setFinancing(prev => ({
      ...prev,
      loanAmount
    }));
  }, [grandTotal]);

  useEffect(() => {
    updateTotals();
  }, [items, taxPercentage]);

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
      date: "",
      paymentDate: "",
      number: "GPH0000",
    });
    setYourCompany({
      name: "George's Plumbing and Heating",
      address: "14 Rathmine Street, London, ON N5Z 1Z3",
      phone: "(519) 555-0123",
      email: "info@georgesplumbingandheating.ca"
    });
    setItems([{ name: "", description: "", quantity: 1, amount: 0, total: 0, productId: "" }]);
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
    localStorage.removeItem("formData");
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
          selectedCurrency
        };
        await generatePDF(formData, 4); // Using template 4
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };


  return (
    <div className="container mx-auto px-4 py-8 relative">
      <h1 className="text-3xl font-bold mb-8 text-center">{isInvoice ? 'Invoice Generator' : 'Quote Generator'}</h1>
      <div className="fixed top-4 left-4 flex gap-2">
        <button
          onClick={clearForm}
          className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
          aria-label="Clear Form"
        >
          <FiTrash2 size={24} />
        </button>
        <button
          onClick={fillDummyData}
          className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600"
          aria-label="Fill with Dummy Data"
        >
          <FiEdit size={24} />
        </button>
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
                  disabled
                />
                <FloatingLabelInput
                  id="invoiceDate"
                  label={`${isInvoice ? 'Invoice' : 'Quote'} Date`}
                  type="date"
                  value={invoice.date}
                  onChange={handleInputChange(setInvoice)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-md order-2 lg:order-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{isInvoice ? 'Invoice Preview' : 'Quote Preview'}</h2>
            <Button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-primary hover:bg-primary/90"
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
          <div 
            className="w-full cursor-pointer"
            onClick={handleDownloadPDF}
            title="Click to download PDF"
          >
            <div className="w-full flex justify-center">
              <div className="bg-gray-200 p-6 rounded-lg shadow-lg border-4 border-gray-300">
                <div className="transform scale-75 origin-top bg-white shadow-sm"
                     style={{ width: '816px' }}>
                <div className="flex">
                  {(() => {
                    // Calculate if content needs multiple pages based on actual content
                    const baseContentHeight = 800; // Template header, footer, sections
                    const itemsHeight = items.length * 60; // Each item row ~60px
                    const financingHeight = financing?.loanAmount ? 150 : 0;
                    const rebatesHeight = (rebatesIncentives && Object.values(rebatesIncentives).some(value => value > 0)) ? 100 : 0;
                    const notesHeight = notes ? 100 : 0;
                    
                    const totalContentHeight = baseContentHeight + itemsHeight + financingHeight + rebatesHeight + notesHeight;
                    const pageHeight = 1123; // US Letter height in pixels at 72 DPI
                    const numberOfPages = totalContentHeight > pageHeight ? Math.ceil(totalContentHeight / pageHeight) : 1;
                    
                    return Array.from({ length: numberOfPages }, (_, pageIndex) => (
                      <div key={pageIndex} className="relative mr-4 last:mr-0">
                        <InvoiceTemplate data={{
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
                          totalPages: numberOfPages
                        }} templateNumber={4} />
                        {/* Page indicator - only show if multiple pages */}
                        {numberOfPages > 1 && (
                          <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                            Page {pageIndex + 1} of {numberOfPages}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                 </div>
                </div>
              </div>
             </div>
           </div>
         </div>
       </div>
     </div>
  );
};

export default Index;
