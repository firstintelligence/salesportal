import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FloatingLabelInput from "@/components/FloatingLabelInput";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Download, Calendar as CalendarIcon, Pen, Save, Loader2, UserCheck, ChevronDown } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import financeitLogo from "@/assets/financeit-logo.svg";
import FullscreenSignaturePad from "@/components/FullscreenSignaturePad";
import IDScanner from "@/components/qualify/IDScanner";
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
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { findOrCreateCustomer } from "@/utils/customerService";


const LoanApplicationPage = ({ embedded = false, embeddedCustomer = null, embeddedCalculatorData = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenant();
  const customer = embedded ? embeddedCustomer : location.state?.customer;
  const calculatorData = embedded ? embeddedCalculatorData : location.state?.calculatorData;
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [savedSignatureDataUrl, setSavedSignatureDataUrl] = useState(null);
  const [createdCustomerId, setCreatedCustomerId] = useState(customer?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isIdScannerOpen, setIsIdScannerOpen] = useState(false);
  
  // Helper to convert ALL CAPS text to Title Case
  const toTitleCase = (str) => {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Handle ID scan completion
  const handleIdScanComplete = (scanData) => {
    setIsIdScannerOpen(false);
    
    // Apply title case to text fields that may come back fully capitalized
    const firstName = toTitleCase(scanData.firstName);
    const lastName = toTitleCase(scanData.lastName);
    const address = toTitleCase(scanData.address);
    const city = toTitleCase(scanData.city);
    
    // Map the scanned data to form fields
    let idType = '';
    if (scanData.idType) {
      const idTypeLower = scanData.idType.toLowerCase();
      if (idTypeLower.includes('driver')) {
        idType = 'drivers_license';
      } else if (idTypeLower.includes('passport')) {
        idType = 'passport';
      } else if (idTypeLower.includes('citizenship')) {
        idType = 'citizenship';
      } else if (idTypeLower.includes('permanent') || idTypeLower.includes('pr')) {
        idType = 'pr_card';
      } else if (idTypeLower.includes('status') || idTypeLower.includes('indian')) {
        idType = 'status_card';
      } else if (idTypeLower.includes('provincial') || idTypeLower.includes('photo id')) {
        idType = 'provincial_id';
      } else if (idTypeLower.includes('health')) {
        idType = 'health_card';
      } else if (idTypeLower.includes('nexus')) {
        idType = 'nexus';
      }
    }
    
    // Map province code
    let province = scanData.province || '';
    if (province.toLowerCase() === 'ontario') {
      province = 'ON';
    } else if (province.length > 2) {
      // Try to convert full province name to code
      const provinceMap = {
        'quebec': 'QC', 'british columbia': 'BC', 'alberta': 'AB',
        'manitoba': 'MB', 'saskatchewan': 'SK', 'nova scotia': 'NS',
        'new brunswick': 'NB', 'newfoundland': 'NL', 'prince edward island': 'PE'
      };
      province = provinceMap[province.toLowerCase()] || province.substring(0, 2).toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      photoIdType: idType || prev.photoIdType,
      photoIdProvince: province || prev.photoIdProvince,
      photoIdNumber: scanData.idNumber || prev.photoIdNumber,
      photoIdExpiry: scanData.idExpiry || prev.photoIdExpiry,
      // Use title-cased values for personal info
      firstName: prev.firstName || firstName || '',
      lastName: prev.lastName || lastName || '',
      birthdate: prev.birthdate || scanData.dateOfBirth || '',
      address: prev.address || address || '',
      city: prev.city || city || '',
      province: prev.province || province || '',
      postalCode: prev.postalCode || scanData.postalCode || '',
    }));
    
    toast.success('ID scanned successfully!');
  };
  
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

  // Preload customer data and loan application data
  useEffect(() => {
    const loadCustomerData = async () => {
      if (customer) {
        // First set basic customer info
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
        
        // Then try to load existing loan application data
        try {
          const { data: loanApp, error } = await supabase
            .from("loan_applications")
            .select("*")
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (!error && loanApp) {
            setFormData(prev => ({
              ...prev,
              // Personal Details
              firstName: loanApp.first_name || prev.firstName,
              lastName: loanApp.last_name || prev.lastName,
              middleName: loanApp.middle_name || prev.middleName,
              birthdate: loanApp.birthdate || prev.birthdate,
              homePhone: loanApp.home_phone || prev.homePhone,
              mobilePhone: loanApp.mobile_phone || prev.mobilePhone,
              maritalStatus: loanApp.marital_status || prev.maritalStatus,
              email: loanApp.email || prev.email,
              sin: loanApp.sin || prev.sin,
              
              // Housing
              address: loanApp.address || prev.address,
              unitNo: loanApp.unit_no || prev.unitNo,
              city: loanApp.city || prev.city,
              province: loanApp.province || prev.province,
              postalCode: loanApp.postal_code || prev.postalCode,
              housingStatus: loanApp.housing_status || prev.housingStatus,
              yearsAtAddress: loanApp.years_at_address || prev.yearsAtAddress,
              monthlyHousingCosts: loanApp.monthly_housing_costs || prev.monthlyHousingCosts,
              
              // Borrower ID
              photoIdType: loanApp.photo_id_type || prev.photoIdType,
              photoIdProvince: loanApp.photo_id_province || prev.photoIdProvince,
              photoIdNumber: loanApp.photo_id_number || prev.photoIdNumber,
              photoIdExpiry: loanApp.photo_id_expiry || prev.photoIdExpiry,
              
              // Employment
              businessName: loanApp.business_name || prev.businessName,
              positionTitle: loanApp.position_title || prev.positionTitle,
              grossMonthlyIncome: loanApp.gross_monthly_income || prev.grossMonthlyIncome,
              employerAddress: loanApp.employer_address || prev.employerAddress,
              timeAtJob: loanApp.time_at_job || prev.timeAtJob,
              employmentStatus: loanApp.employment_status || prev.employmentStatus,
              employerCity: loanApp.employer_city || prev.employerCity,
              employerProvince: loanApp.employer_province || prev.employerProvince,
              
              // Consents - don't reload these, they should be re-consented each time
              privacyConsent: false,
              electronicConsent: false,
              creditConsent: false,
              signatureDate: "",
            }));
            console.log('Loaded existing loan application data for customer:', customer.id);
          }
        } catch (err) {
          console.error('Error loading loan application data:', err);
        }
      }
    };
    
    loadCustomerData();
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

  // Location tracking temporarily disabled - return simple location from form data
  const getUserLocation = () => {
    return new Promise((resolve) => {
      // Use customer address from form if available
      const locationParts = [
        formData.city,
        formData.province,
        formData.postalCode
      ].filter(Boolean);
      
      if (locationParts.length > 0) {
        resolve(locationParts.join(', '));
      } else {
        resolve('Ontario, Canada');
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
                  
                  // Calculate dimensions using FIXED target size to ensure consistency
                  // The signature image may have varying dimensions due to cropping/scaling,
                  // so we use a fixed width and calculate height based on aspect ratio
                  const imgWidth = signatureImage.width;
                  const imgHeight = signatureImage.height;
                  const aspectRatio = imgWidth / imgHeight;
                  
                  // Use a FIXED target width for consistency across all generations
                  // This prevents the signature from growing on regeneration
                  // Reduced by 5% from 161 to 153 points
                  const FIXED_SIGNATURE_WIDTH = 153; // Fixed width in points (~2.1 inches)
                  
                  // Calculate height to maintain aspect ratio
                  let drawWidth = FIXED_SIGNATURE_WIDTH;
                  let drawHeight = drawWidth / aspectRatio;
                  
                  // Ensure minimum height for legibility (also increased by 15%)
                  const MIN_SIGNATURE_HEIGHT = 40;
                  if (drawHeight < MIN_SIGNATURE_HEIGHT) {
                    drawHeight = MIN_SIGNATURE_HEIGHT;
                    drawWidth = drawHeight * aspectRatio;
                  }
                  
                  // Cap maximum height to prevent overly tall signatures (also increased by 15%)
                  const MAX_SIGNATURE_HEIGHT = 69;
                  if (drawHeight > MAX_SIGNATURE_HEIGHT) {
                    drawHeight = MAX_SIGNATURE_HEIGHT;
                    drawWidth = drawHeight * aspectRatio;
                  }
                  
                  // Position signature relative to field - expand upward
                  // Left position stays anchored at rect.x
                  const xPos = rect.x;
                  const yPos = rect.y - 23; // Moved down 10 more pixels (from -13 to -23)
                  
                  // Draw the signature image at proper size
                  page.drawImage(signatureImage, {
                    x: xPos,
                    y: yPos,
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
      
      // IMPORTANT: Create customer and save data BEFORE opening PDF
      // Opening PDF in new window can interrupt JavaScript execution
      
      // Create customer if not exists (when coming from standalone loan application)
      // Note: Super Admin's special "all tenants" tenant has isAllTenants=true and a non-UUID id
      // We need a real tenant ID to create customers/loan applications
      let customerId = createdCustomerId;
      const isValidTenant = tenant?.id && !tenant?.isAllTenants;
      
      console.log('PDF Generation - Customer creation check:', {
        createdCustomerId,
        tenantId: tenant?.id,
        tenantName: tenant?.name,
        isAllTenants: tenant?.isAllTenants,
        isValidTenant,
        willCreateCustomer: !customerId && isValidTenant
      });
      
      if (!customerId && isValidTenant) {
        // Find existing customer or create new one
        // Matches by: exact name, exact phone, or exact email
        const agentId = localStorage.getItem('agentId');
        const phoneDigits = formData.homePhone?.replace(/\D/g, '') || formData.mobilePhone?.replace(/\D/g, '') || '';
        const customerPhone = phoneDigits || 'N/A';
        
        const { customerId: foundCustomerId, isNew, error: customerFindError } = await findOrCreateCustomer(
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: customerPhone,
            address: formData.address || 'N/A',
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
          },
          tenant.id,
          agentId
        );
        
        if (!customerFindError && foundCustomerId) {
          customerId = foundCustomerId;
          setCreatedCustomerId(foundCustomerId);
          if (isNew) {
            console.log('Created new customer from loan application:', customerId);
            toast.success('Customer profile saved to dashboard');
          } else {
            console.log('Found existing customer:', customerId);
            toast.success('Linked to existing customer profile');
          }
        } else if (customerFindError) {
          console.error('Error finding/creating customer:', customerFindError);
          toast.error('Failed to save customer profile: ' + customerFindError.message);
        }
      } else if (!isValidTenant && !customerId) {
        console.warn('Cannot create customer: No valid tenant selected. Super Admin must select a specific tenant to save profiles.');
        toast.warning('Select a specific tenant (not "Super Admin") to save this profile to the dashboard.');
      }
      
      // Save loan application data to database (only if we have a valid tenant, not Super Admin "all tenants" mode)
      if (customerId && isValidTenant) {
        const agentId = localStorage.getItem('agentId');
        const loanAppData = {
          customer_id: customerId,
          tenant_id: tenant.id,
          agent_id: agentId,
          // Personal Details
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName || null,
          birthdate: formData.birthdate || null,
          home_phone: formData.homePhone || null,
          mobile_phone: formData.mobilePhone || null,
          marital_status: formData.maritalStatus || null,
          email: formData.email || null,
          sin: formData.sin || null,
          // Housing
          address: formData.address || null,
          unit_no: formData.unitNo || null,
          city: formData.city || null,
          province: formData.province || null,
          postal_code: formData.postalCode || null,
          housing_status: formData.housingStatus || null,
          years_at_address: formData.yearsAtAddress || null,
          monthly_housing_costs: formData.monthlyHousingCosts || null,
          // Borrower ID
          photo_id_type: formData.photoIdType || null,
          photo_id_province: formData.photoIdProvince || null,
          photo_id_number: formData.photoIdNumber || null,
          photo_id_expiry: formData.photoIdExpiry || null,
          // Employment
          business_name: formData.businessName || null,
          position_title: formData.positionTitle || null,
          gross_monthly_income: formData.grossMonthlyIncome || null,
          employer_address: formData.employerAddress || null,
          time_at_job: formData.timeAtJob || null,
          employment_status: formData.employmentStatus || null,
          employer_city: formData.employerCity || null,
          employer_province: formData.employerProvince || null,
          // Consents
          privacy_consent: formData.privacyConsent,
          electronic_consent: formData.electronicConsent,
          credit_consent: formData.creditConsent,
          signature_date: formData.signatureDate || null,
        };
        
        try {
          // ALWAYS create a new loan application record (never update)
          // Each loan application is its own document attached to the customer profile
          const { data: newLoanApp, error: insertError } = await supabase
            .from("loan_applications")
            .insert(loanAppData)
            .select("id")
            .single();
          
          if (!insertError && newLoanApp) {
            console.log('Created new loan application:', newLoanApp.id);
          } else if (insertError) {
            console.error('Error creating loan application:', insertError);
          }
        } catch (loanAppError) {
          console.error('Error saving loan application data:', loanAppError);
          // Don't fail the process if loan app save fails
        }
      }
      
      // Record document signature for the loan application
      try {
        await recordDocumentSignature({
          documentType: 'loan_application',
          documentId: documentId,
          customerId: customerId || null,
          customerName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
          agentId: localStorage.getItem('agentId') || 'unknown',
          tenantId: tenant?.id || null,
          signatureType: 'customer',
          documentUrl: documentUrl
        });
      } catch (sigError) {
        console.error('Error recording document signature:', sigError);
        // Don't fail the process if signature recording fails
      }
      
      // NOW open the PDF in browser (after all database operations are complete)
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
      
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // Save profile without generating PDF (no signature required)
  const handleSaveProfile = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter first and last name');
      return;
    }
    
    const phoneDigits = formData.homePhone?.replace(/\D/g, '') || formData.mobilePhone?.replace(/\D/g, '');
    if (!phoneDigits) {
      toast.error('Please enter a phone number');
      return;
    }
    
    // Check for valid tenant
    if (!tenant?.id || tenant?.isAllTenants) {
      toast.error('Please select a specific tenant (not "Super Admin") to save profiles.');
      return;
    }
    
    setIsSaving(true);
    try {
      const agentId = localStorage.getItem('agentId');
      
      // Use unified find-or-create customer logic
      const { customerId: foundCustomerId, isNew, error: customerError } = await findOrCreateCustomer(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: phoneDigits,
          address: formData.address || 'N/A',
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
        },
        tenant.id,
        agentId
      );
      
      if (customerError) throw customerError;
      
      const customerId = foundCustomerId;
      setCreatedCustomerId(customerId);
      
      // Save loan application data to database
      const loanAppData = {
        customer_id: customerId,
        tenant_id: tenant.id,
        agent_id: agentId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || null,
        birthdate: formData.birthdate || null,
        home_phone: formData.homePhone || null,
        mobile_phone: formData.mobilePhone || null,
        marital_status: formData.maritalStatus || null,
        email: formData.email || null,
        sin: formData.sin || null,
        address: formData.address || null,
        unit_no: formData.unitNo || null,
        city: formData.city || null,
        province: formData.province || null,
        postal_code: formData.postalCode || null,
        housing_status: formData.housingStatus || null,
        years_at_address: formData.yearsAtAddress || null,
        monthly_housing_costs: formData.monthlyHousingCosts || null,
        photo_id_type: formData.photoIdType || null,
        photo_id_province: formData.photoIdProvince || null,
        photo_id_number: formData.photoIdNumber || null,
        photo_id_expiry: formData.photoIdExpiry || null,
        business_name: formData.businessName || null,
        position_title: formData.positionTitle || null,
        gross_monthly_income: formData.grossMonthlyIncome || null,
        employer_address: formData.employerAddress || null,
        time_at_job: formData.timeAtJob || null,
        employment_status: formData.employmentStatus || null,
        employer_city: formData.employerCity || null,
        employer_province: formData.employerProvince || null,
        privacy_consent: formData.privacyConsent,
        electronic_consent: formData.electronicConsent,
        credit_consent: formData.creditConsent,
        signature_date: formData.signatureDate || null,
      };
      
      // Check for existing loan application for this customer
      const { data: existingLoanApp } = await supabase
        .from("loan_applications")
        .select("id")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existingLoanApp) {
        await supabase.from("loan_applications").update(loanAppData).eq("id", existingLoanApp.id);
      } else {
        await supabase.from("loan_applications").insert(loanAppData);
      }
      
      if (isNew) {
        toast.success('Customer profile created & loan application saved!');
      } else {
        toast.success('Customer profile updated & loan application saved!');
      }
      
      // Navigate to customer detail page
      navigate(`/customer/${customerId}`);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please fill in first and last name');
      return;
    }
    
    if (!formData.birthdate) {
      toast.error('Please enter your date of birth');
      return;
    }
    
    if (!formData.maritalStatus) {
      toast.error('Please select your marital status');
      return;
    }
    
    if (!formData.homePhone) {
      toast.error('Please enter your phone number');
      return;
    }
    
    if (!formData.privacyConsent || !formData.creditConsent) {
      toast.error('You must agree to the Privacy Policy and Credit Authorization');
      return;
    }
    
    // Signature is now optional - PDF can be generated without it
    
    await generatePDF();
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"}>
      {!embedded && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 relative">
          <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/landing")}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2 min-w-[48px]"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">
              Loan Application
            </h1>
            {/* Invisible spacer to balance the back button */}
            <div className="min-w-[48px]"></div>
          </div>
        </div>
      )}
      
      <div className={embedded ? "" : "max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8"}>
        <div className="bg-white border border-border rounded-lg shadow-lg p-4 md:p-8">
          {/* Financeit Logo inside form */}
          <div className="flex justify-start mb-4">
            <img src={financeitLogo} alt="Financeit" className="h-6 md:h-8" />
          </div>
          <div className="border-t-2 border-green-600 mb-6"></div>
          
          {/* Quick Scan ID at Top */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 md:p-5 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm md:text-base text-foreground">Quick Start</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Scan ID to autofill fields</p>
              </div>
              <Button
                type="button"
                variant="default"
                className="shrink-0 h-11 px-5 text-sm md:text-base"
                onClick={() => setIsIdScannerOpen(true)}
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Scan ID
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Details Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                PERSONAL DETAILS
              </div>
              {/* Single continuous grid for mobile - fields flow naturally */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <FloatingLabelInput
                  id="firstName"
                  name="firstName"
                  label="First Name *"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="middleName"
                  name="middleName"
                  label="Middle Name"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="lastName"
                  name="lastName"
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal h-[48px] md:h-[40px]",
                          !formData.birthdate && "text-muted-foreground"
                        )}
                      >
                        {formData.birthdate ? (
                          parseLocalDate(formData.birthdate)?.toLocaleDateString("en-US")
                        ) : (
                          <span className="text-gray-500">Birthdate *</span>
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
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) => handleSelectChange("maritalStatus", value)}
                    required
                  >
                    <SelectTrigger className="h-[48px] md:h-[40px]">
                      <SelectValue placeholder="Marital Status *" />
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
                <FloatingLabelInput
                  id="homePhone"
                  name="homePhone"
                  label="Phone Number *"
                  value={formData.homePhone}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoCapitalize={false}
                />
                <FloatingLabelInput
                  id="mobilePhone"
                  name="mobilePhone"
                  label="Mobile Phone"
                  value={formData.mobilePhone}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="sin"
                  name="sin"
                  label="SIN (Optional)"
                  value={formData.sin}
                  onChange={handleInputChange}
                  autoCapitalize={false}
                />
              </div>
            </div>

            {/* Housing Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                HOUSING
              </div>
              {/* Single continuous grid for mobile */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="col-span-2 md:col-span-2">
                  <FloatingLabelInput
                    id="address"
                    name="address"
                    label="Address *"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <FloatingLabelInput
                  id="unitNo"
                  name="unitNo"
                  label="Unit No."
                  value={formData.unitNo}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="city"
                  name="city"
                  label="City"
                  value={formData.city}
                  onChange={handleInputChange}
                />
                <div>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => handleSelectChange("province", value)}
                  >
                    <SelectTrigger className="h-[48px] md:h-[40px]">
                      <SelectValue placeholder="Province" />
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
                <FloatingLabelInput
                  id="postalCode"
                  name="postalCode"
                  label="Postal Code"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  isPostalCode={true}
                />
                <div>
                  <Select
                    value={formData.housingStatus}
                    onValueChange={(value) => handleSelectChange("housingStatus", value)}
                  >
                    <SelectTrigger className="h-[48px] md:h-[40px]">
                      <SelectValue placeholder="Housing Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own">Own</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FloatingLabelInput
                  id="yearsAtAddress"
                  name="yearsAtAddress"
                  label="Years at Address"
                  type="number"
                  value={formData.yearsAtAddress}
                  onChange={handleInputChange}
                  autoCapitalize={false}
                />
                <div className="relative">
                  <FloatingLabelInput
                    id="monthlyHousingCosts"
                    name="monthlyHousingCosts"
                    label="Monthly Housing $"
                    type="number"
                    value={formData.monthlyHousingCosts}
                    onChange={handleInputChange}
                    autoCapitalize={false}
                  />
                </div>
              </div>
            </div>

            {/* Borrower Identification Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                BORROWER IDENTIFICATION
              </div>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground italic p-2 h-auto">
                    <span>View acceptable forms of photo ID</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <p className="text-xs text-muted-foreground italic bg-muted/50 p-3 rounded-md">
                    Acceptable forms of photo ID: Driver's License, Current Canadian Passport, 
                    Canadian Citizenship Card, Permanent Resident Card, Certificate of Indian Status issued by the Government of Canada, 
                    Provincial Government Photo Identification Card, Provincial Government Health Card (not accepted if issued in Ontario, Manitoba or PEI), Nexus Card, LCBO BYID Card.
                  </p>
                </CollapsibleContent>
              </Collapsible>
              {/* Single continuous grid for mobile */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Select
                    value={formData.photoIdType}
                    onValueChange={(value) => handleSelectChange("photoIdType", value)}
                  >
                    <SelectTrigger className="h-[48px] md:h-[40px]">
                      <SelectValue placeholder="ID Type" />
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
                  <Select
                    value={formData.photoIdProvince}
                    onValueChange={(value) => handleSelectChange("photoIdProvince", value)}
                  >
                    <SelectTrigger className="h-[48px] md:h-[40px]">
                      <SelectValue placeholder="ID Province" />
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
                <FloatingLabelInput
                  id="photoIdNumber"
                  name="photoIdNumber"
                  label="ID Number"
                  value={formData.photoIdNumber}
                  onChange={handleInputChange}
                  autoCapitalize={false}
                />
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal h-[48px] md:h-[40px]",
                          !formData.photoIdExpiry && "text-muted-foreground"
                        )}
                      >
                        {formData.photoIdExpiry ? (
                          parseLocalDate(formData.photoIdExpiry)?.toLocaleDateString("en-US")
                        ) : (
                          <span className="text-gray-500">ID Expiry</span>
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
              
              {/* Scan ID Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10 h-11 text-sm md:text-base"
                onClick={() => setIsIdScannerOpen(true)}
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Scan ID to Auto-Fill
              </Button>
            </div>

            {/* Employment Section */}
            <div className="space-y-3">
              <div className="bg-gray-500 text-white px-3 py-2 text-xs font-semibold uppercase">
                EMPLOYMENT & INCOME
              </div>
              {/* Single continuous grid for mobile */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Select
                    value={formData.employmentStatus}
                    onValueChange={(value) => handleSelectChange("employmentStatus", value)}
                  >
                    <SelectTrigger className="h-[48px] md:h-[40px]">
                      <SelectValue placeholder="Employment Status" />
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
                <FloatingLabelInput
                  id="businessName"
                  name="businessName"
                  label="Business Name"
                  value={formData.businessName}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="positionTitle"
                  name="positionTitle"
                  label="Position"
                  value={formData.positionTitle}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="grossMonthlyIncome"
                  name="grossMonthlyIncome"
                  label="Monthly Income $"
                  type="number"
                  value={formData.grossMonthlyIncome}
                  onChange={handleInputChange}
                  autoCapitalize={false}
                />
                <FloatingLabelInput
                  id="timeAtJob"
                  name="timeAtJob"
                  label="Years at Job"
                  type="number"
                  value={formData.timeAtJob}
                  onChange={handleInputChange}
                  autoCapitalize={false}
                />
                <FloatingLabelInput
                  id="employerAddress"
                  name="employerAddress"
                  label="Work Address"
                  value={formData.employerAddress}
                  onChange={handleInputChange}
                />
                <FloatingLabelInput
                  id="employerCity"
                  name="employerCity"
                  label="Work City"
                  value={formData.employerCity}
                  onChange={handleInputChange}
                />
                <div>
                  <Select
                    value={formData.employerProvince}
                    onValueChange={(value) => handleSelectChange("employerProvince", value)}
                  >
                    <SelectTrigger className="h-[48px] md:h-[40px]">
                      <SelectValue placeholder="Work Province" />
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
                  <Label htmlFor="signature">Signature (Optional)</Label>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal h-[48px] md:h-[40px]",
                          !formData.signatureDate && "text-muted-foreground"
                        )}
                      >
                        {formData.signatureDate ? (
                          parseLocalDate(formData.signatureDate)?.toLocaleDateString("en-US")
                        ) : (
                          <span className="text-gray-500">Date (Optional)</span>
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
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
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
      
      {/* ID Scanner Dialog */}
      <Dialog open={isIdScannerOpen} onOpenChange={setIsIdScannerOpen}>
        <DialogContent className="max-w-md">
          <IDScanner 
            onScanComplete={handleIdScanComplete}
            onCancel={() => setIsIdScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanApplicationPage;
