import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Download, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import SignatureCanvas from "react-signature-canvas";
import financeitLogo from "@/assets/financeit-logo.svg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const LoanApplicationPage = () => {
  const navigate = useNavigate();
  const signatureRef = useRef(null);
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: "",
    lastName: "",
    middleName: "",
    birthdate: "",
    homePhone: "",
    mobilePhone: "",
    maritalStatus: "",
    email: "",
    sin: "",
    
    // Housing
    address: "",
    unitNo: "",
    city: "",
    province: "",
    postalCode: "",
    housingStatus: "",
    yearsAtAddress: "",
    monthlyHousingCosts: "",
    
    // Borrower ID
    photoIdType: "",
    photoIdProvince: "",
    photoIdNumber: "",
    photoIdExpiry: "",
    
    // Employment
    businessName: "",
    positionTitle: "",
    grossMonthlyIncome: "",
    employerAddress: "",
    timeAtJob: "",
    employmentStatus: "",
    employerCity: "",
    employerProvince: "",
    
    // Consents
    privacyConsent: false,
    electronicConsent: false,
    creditConsent: false,
    signatureDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Helper functions for formatting
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatIdType = (type) => {
    if (!type) return '';
    const typeMap = {
      'drivers_license': "Driver's License",
      'passport': 'Canadian Passport',
      'citizenship': 'Canadian Citizenship Card',
      'pr_card': 'Permanent Resident Card',
      'status_card': 'Certificate of Indian Status',
      'provincial_id': 'Provincial Photo ID',
      'health_card': 'Health Card',
      'nexus': 'Nexus Card'
    };
    return typeMap[type] || capitalizeFirst(type);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '';
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const generatePDF = async () => {
    try {
      // Load the PDF template
      const existingPdfBytes = await fetch('/templates/Financeit_Loan_Application_Form_Fillable.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get the form
      const form = pdfDoc.getForm();
      
      // Fill form fields using the actual field names from the PDF
      try {
        const fields = form.getFields();
        console.log('Available PDF fields:', fields.map(f => f.getName()));
        
        // Personal Details
        if (formData.firstName) form.getTextField('First Name').setText(formData.firstName);
        if (formData.lastName) form.getTextField('Last Name').setText(formData.lastName);
        if (formData.middleName) form.getTextField('Middle Name').setText(formData.middleName);
        if (formData.birthdate) form.getTextField('Birthdate').setText(formatDate(formData.birthdate));
        if (formData.homePhone) form.getTextField('Phone Number').setText(formData.homePhone);
        if (formData.maritalStatus) form.getTextField('Marital Status').setText(capitalizeFirst(formData.maritalStatus));
        if (formData.mobilePhone) form.getTextField('Mobile Number').setText(formData.mobilePhone);
        if (formData.email) form.getTextField('Email').setText(formData.email);
        
        // Housing
        if (formData.address) form.getTextField('Address').setText(formData.address);
        if (formData.unitNo) form.getTextField('Unit Number').setText(formData.unitNo);
        if (formData.city) form.getTextField('City').setText(formData.city);
        if (formData.province) form.getTextField('Province').setText(formData.province);
        if (formData.postalCode) form.getTextField('Postal Code').setText(formData.postalCode);
        if (formData.yearsAtAddress) form.getTextField('Years at Residence').setText(formData.yearsAtAddress);
        if (formData.monthlyHousingCosts) form.getTextField('Mortgage Amount').setText(formatCurrency(formData.monthlyHousingCosts));
        if (formData.housingStatus) form.getTextField('Housing Status').setText(capitalizeFirst(formData.housingStatus));
        
        // Employment
        if (formData.businessName) form.getTextField('Employer Name').setText(formData.businessName);
        if (formData.positionTitle) form.getTextField('Position Title').setText(formData.positionTitle);
        if (formData.grossMonthlyIncome) form.getTextField('Gross Monthly Income').setText(formatCurrency(formData.grossMonthlyIncome));
        if (formData.employerAddress) form.getTextField('Employer Address').setText(formData.employerAddress);
        if (formData.timeAtJob) form.getTextField('Time at Job').setText(formData.timeAtJob);
        
        // Employer City and Province (now separate in new PDF)
        if (formData.employerCity) form.getTextField('City').setText(formData.employerCity);
        if (formData.employerProvince) form.getTextField('Province').setText(formData.employerProvince);
        if (formData.employmentStatus) form.getTextField('Employment Status').setText(capitalizeFirst(formData.employmentStatus.replace('_', ' ')));
        
        // Borrower ID
        if (formData.photoIdType) form.getTextField('Photo ID Card Type').setText(formatIdType(formData.photoIdType));
        if (formData.photoIdProvince) form.getTextField('Photo ID Province').setText(formData.photoIdProvince);
        if (formData.photoIdNumber) form.getTextField('Photo ID Number').setText(formData.photoIdNumber);
        if (formData.photoIdExpiry) form.getTextField('Photo ID Expiry').setText(formatDate(formData.photoIdExpiry));
        
        // Signature and Date
        // Embed signature image if available
        if (signatureRef.current && !signatureRef.current.isEmpty()) {
          const signatureDataUrl = signatureRef.current.toDataURL('image/png');
          const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
          const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
          
          // Get the signature field and embed the image
          const signatureField = form.getTextField('Signature');
          const widgets = signatureField.acroField.getWidgets();
          if (widgets.length > 0) {
            const widget = widgets[0];
            const rect = widget.getRectangle();
            const page = pdfDoc.getPages()[widget.P()?.toString() ? parseInt(widget.P().toString()) : 0];
            
            // Draw the signature image in the signature field location
            page.drawImage(signatureImage, {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            });
          }
        }
        if (formData.signatureDate) form.getTextField('Date').setText(formatDate(formData.signatureDate));
        
      } catch (error) {
        console.error('Error filling form fields:', error);
      }
      
      // Flatten form to make it non-editable
      form.flatten();
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Download the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Loan_Application_${formData.firstName}_${formData.lastName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!formData.privacyConsent || !formData.creditConsent) {
      toast.error('You must agree to the Privacy Policy and Credit Authorization');
      return;
    }
    
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Signature is required');
      return;
    }
    
    if (!formData.signatureDate) {
      toast.error('Signature date is required');
      return;
    }
    
    await generatePDF();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/landing")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tools
        </Button>

        <div className="bg-white border border-border rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Loan Application
            </h1>
            <img src={financeitLogo} alt="Financeit" className="h-8" />
          </div>
          <div className="border-t-2 border-green-600 mb-6"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Details Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                PERSONAL DETAILS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    autoComplete="additional-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="birthdate">Birthdate</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal",
                          !formData.birthdate && "text-muted-foreground"
                        )}
                      >
                        {formData.birthdate ? (
                          new Date(formData.birthdate).toLocaleDateString("en-CA")
                        ) : (
                          <span>mm/dd/yyyy</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.birthdate ? new Date(formData.birthdate) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const iso = date.toISOString().split("T")[0];
                          setFormData((prev) => ({ ...prev, birthdate: iso }));
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) => handleSelectChange("maritalStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="commonlaw">Common Law</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="homePhone">Phone Number</Label>
                  <Input
                    id="homePhone"
                    name="homePhone"
                    type="tel"
                    value={formData.homePhone}
                    onChange={handleInputChange}
                    autoComplete="tel-national"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="mobilePhone">Mobile Phone Number</Label>
                  <Input
                    id="mobilePhone"
                    name="mobilePhone"
                    type="tel"
                    value={formData.mobilePhone}
                    onChange={handleInputChange}
                    autoComplete="tel-national"
                  />
                </div>
                <div>
                  <Label htmlFor="sin">SIN Number</Label>
                  <Input
                    id="sin"
                    name="sin"
                    type="text"
                    value={formData.sin}
                    onChange={handleInputChange}
                    maxLength={11}
                    placeholder="XXX-XXX-XXX"
                  />
                </div>
              </div>
            </div>

            {/* Housing Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                HOUSING
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    autoComplete="street-address"
                  />
                </div>
                <div>
                  <Label htmlFor="unitNo">Unit No.</Label>
                  <Input
                    id="unitNo"
                    name="unitNo"
                    value={formData.unitNo}
                    onChange={handleInputChange}
                    autoComplete="address-line2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => handleSelectChange("province", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON">Ontario</SelectItem>
                      <SelectItem value="QC">Quebec</SelectItem>
                      <SelectItem value="BC">British Columbia</SelectItem>
                      <SelectItem value="AB">Alberta</SelectItem>
                      <SelectItem value="MB">Manitoba</SelectItem>
                      <SelectItem value="SK">Saskatchewan</SelectItem>
                      <SelectItem value="NS">Nova Scotia</SelectItem>
                      <SelectItem value="NB">New Brunswick</SelectItem>
                      <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                      <SelectItem value="PE">Prince Edward Island</SelectItem>
                      <SelectItem value="NT">Northwest Territories</SelectItem>
                      <SelectItem value="YT">Yukon</SelectItem>
                      <SelectItem value="NU">Nunavut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    autoComplete="postal-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="housingStatus">Housing Status</Label>
                  <Select
                    value={formData.housingStatus}
                    onValueChange={(value) => handleSelectChange("housingStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own">Own</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="yearsAtAddress">Years at Address</Label>
                  <Input
                    id="yearsAtAddress"
                    name="yearsAtAddress"
                    type="number"
                    value={formData.yearsAtAddress}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyHousingCosts">Monthly Housing Costs</Label>
                  <Input
                    id="monthlyHousingCosts"
                    name="monthlyHousingCosts"
                    type="number"
                    value={formData.monthlyHousingCosts}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Borrower Identification Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                BORROWER IDENTIFICATION
              </div>
              <p className="text-xs text-muted-foreground italic">
                Acceptable forms of photo ID: Driver's License, Current Canadian Passport, 
                Canadian Citizenship Card, Permanent Resident Card, Certificate of Indian Status issued by the Government of Canada, 
                Provincial Government Photo Identification Card, Provincial Government Health Card (not accepted if issued in Ontario, Manitoba or PEI), Nexus Card, LCBO BYID Card.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="photoIdType">ID Type</Label>
                  <Select
                    value={formData.photoIdType}
                    onValueChange={(value) => handleSelectChange("photoIdType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="passport">Canadian Passport</SelectItem>
                      <SelectItem value="citizenship">Canadian Citizenship Card</SelectItem>
                      <SelectItem value="pr_card">Permanent Resident Card</SelectItem>
                      <SelectItem value="status_card">Certificate of Indian Status</SelectItem>
                      <SelectItem value="provincial_id">Provincial Photo ID</SelectItem>
                      <SelectItem value="health_card">Health Card</SelectItem>
                      <SelectItem value="nexus">Nexus Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="photoIdProvince">ID Province</Label>
                  <Select
                    value={formData.photoIdProvince}
                    onValueChange={(value) => handleSelectChange("photoIdProvince", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON">Ontario</SelectItem>
                      <SelectItem value="QC">Quebec</SelectItem>
                      <SelectItem value="BC">British Columbia</SelectItem>
                      <SelectItem value="AB">Alberta</SelectItem>
                      <SelectItem value="MB">Manitoba</SelectItem>
                      <SelectItem value="SK">Saskatchewan</SelectItem>
                      <SelectItem value="NS">Nova Scotia</SelectItem>
                      <SelectItem value="NB">New Brunswick</SelectItem>
                      <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                      <SelectItem value="PE">Prince Edward Island</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="photoIdNumber">ID Number</Label>
                  <Input
                    id="photoIdNumber"
                    name="photoIdNumber"
                    value={formData.photoIdNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="photoIdExpiry">ID Expiry Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal",
                          !formData.photoIdExpiry && "text-muted-foreground"
                        )}
                      >
                        {formData.photoIdExpiry ? (
                          new Date(formData.photoIdExpiry).toLocaleDateString("en-CA")
                        ) : (
                          <span>mm/dd/yyyy</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.photoIdExpiry ? new Date(formData.photoIdExpiry) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const iso = date.toISOString().split("T")[0];
                          setFormData((prev) => ({ ...prev, photoIdExpiry: iso }));
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Employment Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                EMPLOYMENT & INCOME INFORMATION
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="positionTitle">Position Title</Label>
                  <Input
                    id="positionTitle"
                    name="positionTitle"
                    value={formData.positionTitle}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grossMonthlyIncome">Gross Monthly Income</Label>
                  <Input
                    id="grossMonthlyIncome"
                    name="grossMonthlyIncome"
                    type="number"
                    value={formData.grossMonthlyIncome}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employerAddress">Employer Address</Label>
                  <Input
                    id="employerAddress"
                    name="employerAddress"
                    value={formData.employerAddress}
                    onChange={handleInputChange}
                    autoComplete="work street-address"
                  />
                </div>
                <div>
                  <Label htmlFor="timeAtJob">Time at Job (Years)</Label>
                  <Input
                    id="timeAtJob"
                    name="timeAtJob"
                    type="number"
                    value={formData.timeAtJob}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employerCity">Employer City</Label>
                  <Input
                    id="employerCity"
                    name="employerCity"
                    value={formData.employerCity}
                    onChange={handleInputChange}
                    autoComplete="work address-level2"
                  />
                </div>
                <div>
                  <Label htmlFor="employerProvince">Employer Province</Label>
                  <Select
                    value={formData.employerProvince}
                    onValueChange={(value) => handleSelectChange("employerProvince", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON">Ontario</SelectItem>
                      <SelectItem value="QC">Quebec</SelectItem>
                      <SelectItem value="BC">British Columbia</SelectItem>
                      <SelectItem value="AB">Alberta</SelectItem>
                      <SelectItem value="MB">Manitoba</SelectItem>
                      <SelectItem value="SK">Saskatchewan</SelectItem>
                      <SelectItem value="NS">Nova Scotia</SelectItem>
                      <SelectItem value="NB">New Brunswick</SelectItem>
                      <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                      <SelectItem value="PE">Prince Edward Island</SelectItem>
                      <SelectItem value="NT">Northwest Territories</SelectItem>
                      <SelectItem value="YT">Yukon</SelectItem>
                      <SelectItem value="NU">Nunavut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select
                  value={formData.employmentStatus}
                  onValueChange={(value) => handleSelectChange("employmentStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="disability">Disability</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Consents Section */}
            <div className="space-y-3">
              
              <div className="space-y-3">
                {/* Privacy Policy Consent */}
                <div className="space-y-2">
                  <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                    CONSENT TO FINANCEIT CANADA INC. PRIVACY POLICY AND THIRD-PARTY DETERMINATION
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacyConsent"
                      checked={formData.privacyConsent}
                      onCheckedChange={(checked) => handleCheckboxChange("privacyConsent", checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="privacyConsent" className="text-xs leading-relaxed cursor-pointer flex-1">
                      I accept the Financeit Canada Privacy Policy, located at <span className="text-blue-600">https://www.financeit.io/privacy-policy</span>. I also confirm that there is no person or company directing me to apply for financing and use this loan on their direction or behalf.
                    </Label>
                  </div>
                </div>

                {/* Electronic Disclosures Consent */}
                <div className="space-y-2">
                  <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                    CONSENT TO ELECTRONIC DISCLOSURES* (OPTIONAL)
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="electronicConsent"
                      checked={formData.electronicConsent}
                      onCheckedChange={(checked) => handleCheckboxChange("electronicConsent", checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="electronicConsent" className="text-xs leading-relaxed cursor-pointer flex-1">
                      I consent to receive Disclosures (including the Loan Agreement, Amendments, Statements and Renewals, notices and other associated documents) electronically. For more information, please visit <span className="text-blue-600">https://www.financeit.io/electronic-consent-agreement/</span>
                    </Label>
                  </div>
                </div>

                {/* Credit Authorization */}
                <div className="space-y-2">
                  <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                    CREDIT AUTHORIZATION
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="creditConsent"
                      checked={formData.creditConsent}
                      onCheckedChange={(checked) => handleCheckboxChange("creditConsent", checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="creditConsent" className="text-xs leading-relaxed cursor-pointer flex-1">
                      I agree, acknowledge and represent, that by personally submitting this application Financeit is authorized to obtain my credit report from one or more consumer credit reporting agencies, to verify the information in my credit report with third parties as necessary, and to periodically update my credit information with credit reporting agencies.
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <Label htmlFor="signature">Signature *</Label>
                  <div className="border border-border rounded-md bg-background">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: 'w-full h-32 rounded-md',
                      }}
                      backgroundColor="rgb(255, 255, 255)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="mt-2"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Signature
                  </Button>
                </div>
                <div className="w-full">
                  <Label htmlFor="signatureDate">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal",
                          !formData.signatureDate && "text-muted-foreground"
                        )}
                      >
                        {formData.signatureDate ? (
                          new Date(formData.signatureDate).toLocaleDateString("en-CA")
                        ) : (
                          <span>mm/dd/yyyy</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.signatureDate ? new Date(formData.signatureDate) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const iso = date.toISOString().split("T")[0];
                          setFormData((prev) => ({ ...prev, signatureDate: iso }));
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Generate PDF
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoanApplicationPage;
