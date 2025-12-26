import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Download, Calendar as CalendarIcon, Pen } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import financeitLogo from "@/assets/financeit-logo.svg";
import FullscreenSignaturePad from "@/components/FullscreenSignaturePad";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
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
import AddressAutocomplete from "../components/AddressAutocomplete";
import { capitalizeWords, formatPostalCode, formatPhoneNumber } from "@/utils/inputFormatting";
import { recordDocumentSignature } from "@/utils/signingLocationService";


const LoanApplicationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [savedSignatureDataUrl, setSavedSignatureDataUrl] = useState(null);
  
  const formatLocalDate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  const parseLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };
  
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

  // Preload customer data
  useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        firstName: customer.first_name || "",
        lastName: customer.last_name || "",
        email: customer.email || "",
        homePhone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        province: customer.province || "",
        postalCode: customer.postal_code || "",
      }));
    }
  }, [customer]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Apply formatting based on field type
    let formattedValue = value;
    if (['firstName', 'lastName', 'middleName', 'address', 'city', 'employerAddress', 'employerCity', 'businessName', 'positionTitle'].includes(name)) {
      formattedValue = capitalizeWords(value);
    } else if (name === 'postalCode') {
      formattedValue = formatPostalCode(value);
    } else if (['homePhone', 'mobilePhone'].includes(name)) {
      formattedValue = formatPhoneNumber(value);
    }
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };
  const handleAddressSelect = (addressData) => {
    setFormData((prev) => ({
      ...prev,
      address: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
    }));
  };

  const handleEmployerAddressSelect = (addressData) => {
    setFormData((prev) => ({
      ...prev,
      employerAddress: addressData.street,
      employerCity: addressData.city,
      employerProvince: addressData.province,
    }));
  };

  // Helper functions for formatting
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseLocalDate(dateString);
    if (!date) return '';
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
    setSavedSignatureDataUrl(null);
  };

  const handleSignatureSave = (dataUrl) => {
    setSavedSignatureDataUrl(dataUrl);
  };

  // Get user's location using geolocation API with IP fallback
  const getUserLocation = () => {
    return new Promise(async (resolve) => {
      // Helper to get IP-based location as fallback
      const getIpLocation = async () => {
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          if (data && data.city) {
            return [data.city, data.region, data.postal].filter(Boolean).join(', ');
          }
          return null;
        } catch {
          return null;
        }
      };

      // Helper to reverse geocode coordinates
      const reverseGeocode = async (latitude, longitude) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const { house_number, road, city, town, village, state, postcode } = data.address;
            const streetAddress = [house_number, road].filter(Boolean).join(' ');
            const locality = city || town || village || '';
            return [streetAddress, locality, state, postcode].filter(Boolean).join(', ');
          }
          return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        } catch {
          return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
      };

      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const location = await reverseGeocode(latitude, longitude);
            resolve(location);
          },
          async () => {
            // Browser geolocation failed, try IP-based fallback
            const ipLocation = await getIpLocation();
            resolve(ipLocation || 'Location unavailable');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        // No geolocation support, try IP-based fallback
        const ipLocation = await getIpLocation();
        resolve(ipLocation || 'Location unavailable');
      }
    });
  };

  const generatePDF = async () => {
    try {
      // Get location first (this may prompt user for permission)
      toast.info('Getting your location for signing certificate...');
      const location = await getUserLocation();
      
      // Get current date/time in Toronto timezone
      const now = new Date();
      const torontoTime = toZonedTime(now, 'America/Toronto');
      const formattedDateTime = format(torontoTime, "MMMM d, yyyy 'at' h:mm:ss a 'EST'");
      
      // Build signing certificate text (location will always have a value now)
      const signingCertificate = `Signed on ${formattedDateTime} at ${location}`;
      
      // Load the PDF template with no-cache to ensure fresh copy
      const existingPdfBytes = await fetch('/templates/Financeit_Loan_Application_Form_Fillable.pdf', {
        cache: 'no-store'
      }).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes, { 
        ignoreEncryption: true 
      });
      
      // Get the form
      const form = pdfDoc.getForm();
      
      // Fill form fields using the actual field names from the PDF
      try {
        const fields = form.getFields();
        const fieldNames = fields.map(f => f.getName());
        console.log('=== AVAILABLE PDF FIELDS ===');
        fieldNames.forEach((name, i) => console.log(`${i + 1}. "${name}"`));
        
        // Helper function to try setting a field with multiple possible names
        const setField = (possibleNames, value) => {
          if (!value) return false;
          for (const name of possibleNames) {
            try {
              const field = form.getTextField(name);
              if (field) {
                field.setText(String(value));
                console.log(`✓ Filled "${name}" with "${value}"`);
                return true;
              }
            } catch (e) {
              // Field doesn't exist with this name, try next
            }
          }
          console.log(`✗ Could not find field for: ${possibleNames[0]} (tried: ${possibleNames.join(', ')})`);
          return false;
        };
        
        // Helper function to set checkbox fields
        const setCheckbox = (possibleNames, checked) => {
          for (const name of possibleNames) {
            try {
              const field = form.getCheckBox(name);
              if (field) {
                if (checked) {
                  field.check();
                } else {
                  field.uncheck();
                }
                console.log(`✓ Checkbox "${name}" set to ${checked}`);
                return true;
              }
            } catch (e) {
              // Not a checkbox or doesn't exist, try next
            }
          }
          console.log(`✗ Could not find checkbox for: ${possibleNames[0]}`);
          return false;
        };
        
        // Personal Details
        setField(['Photo ID First Name', 'First Name', 'FirstName'], formData.firstName);
        setField(['Photo ID Last Name', 'Last Name', 'LastName'], formData.lastName);
        setField(['Photo ID Middle Name', 'Middle Name', 'MiddleName'], formData.middleName);
        setField(['Birthdate', 'Birth Date', 'DOB', 'Date of Birth'], formatDate(formData.birthdate));
        setField(['Home Phone Number', 'Phone Number', 'Home Phone', 'HomePhone'], formData.homePhone);
        setField(['Marital Status', 'MaritalStatus'], capitalizeFirst(formData.maritalStatus));
        setField(['Mobile Phone Number', 'Mobile Number', 'Mobile Phone', 'Cell Phone'], formData.mobilePhone);
        setField(['Email', 'Email Address', 'EmailAddress'], formData.email);
        setField(['Social Insurance Number', 'SIN', 'SIN Number'], formData.sin);
        
        // Housing
        setField(['Address', 'Street Address', 'Home Address'], formData.address);
        setField(['Unit No', 'Unit No.', 'Unit Number', 'Apt', 'Apt.'], formData.unitNo);
        setField(['City', 'City_1'], formData.city);
        setField(['Province', 'Province_1', 'State'], formData.province);
        setField(['Postal Code', 'PostalCode', 'Zip Code'], formData.postalCode);
        setField(['No Years at this Address', 'No. Years at this Address', 'Years at Address', 'Years at Residence'], formData.yearsAtAddress);
        setField(['Monthly Housing Costs', 'Housing Costs', 'Mortgage Amount', 'Monthly Rent'], formatCurrency(formData.monthlyHousingCosts));
        setField(['Housing Status', 'HousingStatus', 'Residence Type'], capitalizeFirst(formData.housingStatus));
        
        // Employment
        setField(['Business Name', 'Employer Name', 'Company Name', 'Employer'], formData.businessName);
        setField(['Position Title', 'Job Title', 'Position', 'Title'], formData.positionTitle);
        setField(['Gross Monthly Income', 'Monthly Income', 'Income', 'GrossIncome'], formatCurrency(formData.grossMonthlyIncome));
        setField(['Employer Address', 'Work Address', 'Business Address'], formData.employerAddress);
        setField(['Time at Job', 'Time at Job (Years)', 'Years at Job', 'Time at Employer'], formData.timeAtJob);
        setField(['City_2', 'Employer City', 'Work City', 'Job City', 'City 2', 'EmployerCity'], formData.employerCity);
        setField(['Province_2', 'Employer Province', 'Work Province', 'Job Province', 'Province 2', 'EmployerProvince'], formData.employerProvince);
        setField(['Employment Status', 'EmploymentStatus', 'Work Status'], capitalizeFirst(formData.employmentStatus?.replace('_', ' ')));
        
        // Borrower ID
        setField(['Photo ID Card Type', 'ID Type', 'Photo ID Type'], formatIdType(formData.photoIdType));
        setField(['Photo ID Province', 'ID Province', 'Province of Issue'], formData.photoIdProvince);
        setField(['Photo ID Number', 'ID Number', 'License Number'], formData.photoIdNumber);
        setField(['Photo ID Expiry', 'ID Expiry', 'Expiry Date', 'Expiration Date'], formatDate(formData.photoIdExpiry));
        
        // Consent fields - mark with centered "x" if consented
        const setCenteredX = async (possibleNames) => {
          for (const name of possibleNames) {
            try {
              const field = form.getTextField(name);
              if (field) {
                // Set the text with center alignment
                field.setAlignment(1); // 1 = center alignment
                field.setText('x');
                console.log(`✓ Set centered "x" in "${name}"`);
                return true;
              }
            } catch (e) {
              // Not a text field, continue
            }
          }
          return false;
        };
        
        if (formData.privacyConsent) {
          await setCenteredX(['Consent 1', 'Privacy Consent', 'PrivacyConsent', 'Privacy', 'Check Box 1', 'Check Box1', 'checkbox1', 'Checkbox1']);
        }
        if (formData.electronicConsent) {
          await setCenteredX(['Consent 2', 'Electronic Consent', 'ElectronicConsent', 'Electronic', 'Check Box 2', 'Check Box2', 'checkbox2', 'Checkbox2']);
        }
        
        // Signing Certificate - draw centered text directly on page
        const signingCertFieldNames = ['Signing Certificate', 'Certificate', 'Sign Certificate'];
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        for (const fieldName of signingCertFieldNames) {
          try {
            const certField = form.getTextField(fieldName);
            if (certField) {
              const widgets = certField.acroField.getWidgets();
              if (widgets.length > 0) {
                const widget = widgets[0];
                const rect = widget.getRectangle();
                const pages = pdfDoc.getPages();
                const page = pages[0];
                
                // Clear the field
                certField.setText('');
                
                // Calculate text width to center it
                const fontSize = 6;
                const textWidth = helveticaFont.widthOfTextAtSize(signingCertificate, fontSize);
                const xPos = rect.x + (rect.width - textWidth) / 2;
                const yPos = rect.y + (rect.height - fontSize) / 2;
                
                // Draw centered text
                page.drawText(signingCertificate, {
                  x: xPos,
                  y: yPos,
                  size: fontSize,
                  font: helveticaFont,
                  color: rgb(0, 0, 0),
                });
                
                console.log(`✓ Signing certificate centered in "${fieldName}"`);
                break;
              }
            }
          } catch (e) {
            console.log(`Could not set signing certificate in "${fieldName}":`, e.message);
          }
        }
        
        // Signature and Date
        setField(['Date', 'Signature Date', 'Sign Date'], formatDate(formData.signatureDate));
        
        // Embed signature image if available
        if (savedSignatureDataUrl) {
          const signatureImageBytes = await fetch(savedSignatureDataUrl).then(res => res.arrayBuffer());
          const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
          
          // Try to find signature field with different names and draw image directly on page
          const signatureFieldNames = ['Signature', 'Sign', 'Customer Signature', 'Applicant Signature'];
          let signatureEmbedded = false;
          
          for (const fieldName of signatureFieldNames) {
            if (signatureEmbedded) break;
            try {
              const signatureField = form.getTextField(fieldName);
              if (signatureField) {
                const widgets = signatureField.acroField.getWidgets();
                if (widgets.length > 0) {
                  const widget = widgets[0];
                  const rect = widget.getRectangle();
                  
                  // Get the page
                  const pages = pdfDoc.getPages();
                  const page = pages[0];
                  
                  // Clear the text field
                  signatureField.setText('');
                  
                  // Calculate dimensions to fit signature while maintaining aspect ratio
                  const imgWidth = signatureImage.width;
                  const imgHeight = signatureImage.height;
                  const aspectRatio = imgWidth / imgHeight;
                  
                  let drawWidth = rect.width;
                  let drawHeight = drawWidth / aspectRatio;
                  
                  if (drawHeight > rect.height) {
                    drawHeight = rect.height;
                    drawWidth = drawHeight * aspectRatio;
                  }
                  
                  // Center the signature in the field
                  const xOffset = (rect.width - drawWidth) / 2;
                  const yOffset = (rect.height - drawHeight) / 2;
                  
                  // Draw the signature image
                  page.drawImage(signatureImage, {
                    x: rect.x + xOffset,
                    y: rect.y + yOffset,
                    width: drawWidth,
                    height: drawHeight,
                  });
                  
                  console.log(`✓ Signature embedded in field "${fieldName}" at x:${rect.x}, y:${rect.y}, w:${rect.width}, h:${rect.height}`);
                  signatureEmbedded = true;
                }
              }
            } catch (e) {
              console.log(`Could not embed signature in "${fieldName}":`, e.message);
            }
          }
          
          if (!signatureEmbedded) {
            console.log('✗ Could not find signature field to embed image');
          }
        }
        
      } catch (error) {
        console.error('Error filling form fields:', error);
      }
      
      // Flatten form to prevent editing and remove old data
      try {
        form.flatten();
      } catch (flattenError) {
        console.warn('Error flattening form, continuing without flattening:', flattenError);
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false
      });
      
      // Generate document ID and upload to storage
      const documentId = crypto.randomUUID();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      let documentUrl = null;
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const fileName = `Loan_Application_${formData.firstName}_${formData.lastName}.pdf`;
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9\-_.]/g, '_');
        const storagePath = `${documentId}/${sanitizedFileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, blob, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(storagePath);
          
          documentUrl = urlData?.publicUrl || null;
          console.log('Loan application uploaded to storage:', documentUrl);
        }
      } catch (storageError) {
        console.error('Error with document storage:', storageError);
      }
      
      // Open the PDF in browser instead of downloading
      const url = URL.createObjectURL(blob);
      
      // Open in new tab/window on mobile and desktop
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        // Clean up after a delay to ensure PDF loads
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        // Fallback to download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `Loan_Application_${formData.firstName}_${formData.lastName}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      // Record document signature for the loan application
      try {
        await recordDocumentSignature({
          documentType: 'loan_application',
          documentId: documentId,
          customerId: customer?.id || null,
          customerName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
          agentId: localStorage.getItem('agentId') || 'unknown',
          tenantId: null,
          signatureType: 'customer',
          documentUrl: documentUrl
        });
      } catch (sigError) {
        console.error('Error recording document signature:', sigError);
        // Don't fail the process if signature recording fails
      }
      
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
    
    if (!savedSignatureDataUrl) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
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
            Loan Application
          </h1>
          <img src={financeitLogo} alt="Financeit" className="h-5 md:h-6" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="bg-white border border-border rounded-lg shadow-lg p-4 md:p-8">
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
                          parseLocalDate(formData.birthdate)?.toLocaleDateString("en-US")
                        ) : (
                          <span>mm/dd/yyyy</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.birthdate ? parseLocalDate(formData.birthdate) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const iso = formatLocalDate(date);
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
                <div className="md:col-start-3 md:row-start-1">
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
                <div className="md:col-start-1 md:row-start-1">
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
                <div className="md:col-start-2 md:row-start-1">
                  <Label htmlFor="sin">SIN Number (Optional)</Label>
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
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    autoComplete="off"
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
                      <SelectItem value="ON">ON</SelectItem>
                      <SelectItem value="QC">QC</SelectItem>
                      <SelectItem value="BC">BC</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="MB">MB</SelectItem>
                      <SelectItem value="SK">SK</SelectItem>
                      <SelectItem value="NS">NS</SelectItem>
                      <SelectItem value="NB">NB</SelectItem>
                      <SelectItem value="NL">NL</SelectItem>
                      <SelectItem value="PE">PE</SelectItem>
                      <SelectItem value="NT">NT</SelectItem>
                      <SelectItem value="YT">YT</SelectItem>
                      <SelectItem value="NU">NU</SelectItem>
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
                      <SelectItem value="ON">ON</SelectItem>
                      <SelectItem value="QC">QC</SelectItem>
                      <SelectItem value="BC">BC</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="MB">MB</SelectItem>
                      <SelectItem value="SK">SK</SelectItem>
                      <SelectItem value="NS">NS</SelectItem>
                      <SelectItem value="NB">NB</SelectItem>
                      <SelectItem value="NL">NL</SelectItem>
                      <SelectItem value="PE">PE</SelectItem>
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
                          parseLocalDate(formData.photoIdExpiry)?.toLocaleDateString("en-US")
                        ) : (
                          <span>mm/dd/yyyy</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.photoIdExpiry ? parseLocalDate(formData.photoIdExpiry) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const iso = formatLocalDate(date);
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
              {/* Row 1: Employment Status, Business Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 2: Position Title, Gross Monthly Income */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="positionTitle">Position Title</Label>
                  <Input
                    id="positionTitle"
                    name="positionTitle"
                    value={formData.positionTitle}
                    onChange={handleInputChange}
                  />
                </div>
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

              {/* Row 3: Time at Job, Employer Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="employerAddress">Employer Address</Label>
                  <Input
                    id="employerAddress"
                    name="employerAddress"
                    value={formData.employerAddress}
                    onChange={handleInputChange}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Row 4: Employer City, Employer Province */}
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
                      <SelectItem value="ON">ON</SelectItem>
                      <SelectItem value="QC">QC</SelectItem>
                      <SelectItem value="BC">BC</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="MB">MB</SelectItem>
                      <SelectItem value="SK">SK</SelectItem>
                      <SelectItem value="NS">NS</SelectItem>
                      <SelectItem value="NB">NB</SelectItem>
                      <SelectItem value="NL">NL</SelectItem>
                      <SelectItem value="PE">PE</SelectItem>
                      <SelectItem value="NT">NT</SelectItem>
                      <SelectItem value="YT">YT</SelectItem>
                      <SelectItem value="NU">NU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <div 
                    className="border border-border rounded-md bg-white cursor-pointer hover:border-primary transition-colors min-h-32 flex items-center justify-center relative overflow-hidden"
                    onClick={() => setIsSignaturePadOpen(true)}
                  >
                    {savedSignatureDataUrl ? (
                      <img 
                        src={savedSignatureDataUrl} 
                        alt="Signature" 
                        className="max-w-full max-h-28 object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Pen className="h-8 w-8 mb-2" />
                        <span className="text-sm">Tap to sign</span>
                      </div>
                    )}
                  </div>
                  {savedSignatureDataUrl && (
                    <p className="text-xs text-muted-foreground mt-1">Tap to edit signature</p>
                  )}
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
                          parseLocalDate(formData.signatureDate)?.toLocaleDateString("en-US")
                        ) : (
                          <span>mm/dd/yyyy</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.signatureDate ? parseLocalDate(formData.signatureDate) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const iso = formatLocalDate(date);
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

      {/* Fullscreen Signature Pad */}
      <FullscreenSignaturePad
        isOpen={isSignaturePadOpen}
        onClose={() => setIsSignaturePadOpen(false)}
        onSave={handleSignatureSave}
        initialSignature={savedSignatureDataUrl}
      />
    </div>
  );
};

export default LoanApplicationPage;
