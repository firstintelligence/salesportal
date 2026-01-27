import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { getTenantCompanyInfo, getTenantDocumentLogo } from '@/utils/tenantLogos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getProvincialTax, calculateMonthlyPayment } from '@/utils/financingCalculations';
import FullscreenSignaturePad from '@/components/FullscreenSignaturePad';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';
import { formatPhoneNumber, formatPostalCode } from '@/utils/inputFormatting';
import { formatCurrency } from '@/utils/formatCurrency';
import { canadianProvinces } from '@/utils/canadianProvinces';

// Super admin check
const SUPER_ADMIN_ID = 'MM231611';

const CustomInvoiceV2Page = () => {
  const navigate = useNavigate();
  const { tenant, isSuperAdmin } = useTenant();
  const agentId = localStorage.getItem('agentId');
  const isSuperAdminUser = agentId === SUPER_ADMIN_ID;

  // Redirect if not super admin
  useEffect(() => {
    if (!localStorage.getItem('authenticated')) {
      navigate('/');
      return;
    }
    if (!isSuperAdminUser) {
      toast.error('Access denied. Super admin only.');
      navigate('/landing');
    }
  }, [navigate, isSuperAdminUser]);

  // Form state
  const [formData, setFormData] = useState({
    // Customer info
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    positionTitle: '',
    lengthOfEmployment: '',
    annualIncome: '',
    // Checklist
    existingAC_Y: false,
    existingAC_N: false,
    roGranite: false,
    bathrooms_Y: false,
    bathrooms_N: false,
    atticAccessible: false,
    wifi_Y: false,
    wifi_N: false,
    electricalOutlet: false,
    sqFt: '',
    occupantsNo: '',
  });

  // Products - Energy Efficiency
  const [energyEfficiency, setEnergyEfficiency] = useState({
    airConditioner: '',
    airSealing: '',
    atticInsulation: '',
    ductlessHeatPump: '',
    furnace: '',
    heatPump: '',
    tanklessWaterHeater: '',
    waterHeater: '',
    windowsSealing: '',
  });

  // Products - Home Comfort
  const [homeComfort, setHomeComfort] = useState({
    carbonFilter: '',
    electronicAirCleaner: '',
    hepaFilter: '',
    humidifier: '',
    reverseOsmosis: '',
    uvAirFilter: '',
    uvWaterFilter: '',
    waterSoftener: '',
  });

  // Products - Smart Solutions
  const [smartSolutions, setSmartSolutions] = useState({
    securitySensors: '',
    smartOutdoorCamera: '',
    smartIndoorCamera: '',
    smartDoorlock: '',
    smartDoorbell: '',
    smartHub: '',
    smartSmokeDetector: '',
    smartThermostat: '',
  });

  // Special arrangements
  const [specialArrangements, setSpecialArrangements] = useState('');

  // Financial section
  const [financial, setFinancial] = useState({
    subtotal: '',
    termMonths: '',
    monthlyPayment: '',
    amortizationMonths: '',
    interestRate: '',
    adminFee: '99.95',
    hst: '',
    rebates: '',
    acceptPrivacyPolicy: false,
    electronicConsent: false,
    creditConsent: false,
  });

  // Signatures
  const [customerSignature, setCustomerSignature] = useState(null);
  const [agentSignature, setAgentSignature] = useState(null);
  const [signDate, setSignDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [agentName, setAgentName] = useState('');

  // UI state
  const [isCustomerSigPadOpen, setIsCustomerSigPadOpen] = useState(false);
  const [isAgentSigPadOpen, setIsAgentSigPadOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tenant info
  const tenantLogo = tenant?.slug ? getTenantDocumentLogo(tenant.slug) : null;
  const tenantCompanyInfo = tenant?.slug ? getTenantCompanyInfo(tenant.slug) : null;

  // Update customer name when first/last name changes
  useEffect(() => {
    setCustomerName(`${formData.firstName} ${formData.lastName}`.trim());
  }, [formData.firstName, formData.lastName]);

  // Calculate HST when subtotal changes
  useEffect(() => {
    const subtotalNum = parseFloat(financial.subtotal.replace(/[^0-9.]/g, '')) || 0;
    const hst = subtotalNum * 0.13;
    setFinancial(prev => ({
      ...prev,
      hst: hst.toFixed(2)
    }));
  }, [financial.subtotal]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressSelect = (addressData) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.fullAddress || '',
      postalCode: addressData.postalCode || prev.postalCode,
    }));
  };

  const handleGeneratePDF = async () => {
    if (!tenant) {
      toast.error('Please select a tenant first');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare the data for the edge function
      const invoiceData = {
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          postalCode: formData.postalCode,
          positionTitle: formData.positionTitle,
          lengthOfEmployment: formData.lengthOfEmployment,
          annualIncome: formData.annualIncome,
        },
        checklist: {
          existingAC: formData.existingAC_Y ? 'Y' : formData.existingAC_N ? 'N' : '',
          roGranite: formData.roGranite,
          bathrooms: formData.bathrooms_Y ? 'Y' : formData.bathrooms_N ? 'N' : '',
          atticAccessible: formData.atticAccessible,
          wifi: formData.wifi_Y ? 'Y' : formData.wifi_N ? 'N' : '',
          electricalOutlet: formData.electricalOutlet,
          sqFt: formData.sqFt,
          occupantsNo: formData.occupantsNo,
        },
        energyEfficiency,
        homeComfort,
        smartSolutions,
        specialArrangements,
        financial: {
          subtotal: financial.subtotal,
          termMonths: financial.termMonths,
          monthlyPayment: financial.monthlyPayment,
          amortizationMonths: financial.amortizationMonths,
          interestRate: financial.interestRate,
          adminFee: financial.adminFee,
          hst: financial.hst,
          rebates: financial.rebates,
          acceptPrivacyPolicy: financial.acceptPrivacyPolicy,
          electronicConsent: financial.electronicConsent,
          creditConsent: financial.creditConsent,
        },
        signatures: {
          customerSignature,
          agentSignature,
          signDate,
          customerName,
          agentName,
        },
        tenantInfo: {
          name: tenantCompanyInfo?.name || tenant?.name,
          phone: tenantCompanyInfo?.phone || '',
          email: tenantCompanyInfo?.email || '',
          address: tenantCompanyInfo?.address || '',
          logo: tenantLogo,
        }
      };

      // Call edge function to generate PDF
      const { data, error } = await supabase.functions.invoke('generate-custom-invoice-v2', {
        body: { invoiceData }
      });

      if (error) throw error;

      // Download the PDF
      const blob = new Blob([Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tenant?.name || 'Invoice'}_${formData.firstName}_${formData.lastName}_V2.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Invoice PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isSuperAdminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/landing')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Custom Invoice V2</h1>
              <p className="text-sm text-muted-foreground">Super Admin Only</p>
            </div>
          </div>
          {tenantLogo && (
            <img src={tenantLogo} alt={tenant?.name} className="h-10 object-contain" />
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Customer Information */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <Label>Address</Label>
                <GooglePlacesAutocomplete
                  value={formData.address}
                  onChange={(val) => setFormData(prev => ({ ...prev, address: val }))}
                  onSelect={handleAddressSelect}
                  placeholder="Start typing address..."
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: formatPostalCode(e.target.value) }))}
                  placeholder="A1A 1A1"
                />
              </div>
              <div>
                <Label htmlFor="positionTitle">Position Title</Label>
                <Input
                  id="positionTitle"
                  name="positionTitle"
                  value={formData.positionTitle}
                  onChange={handleInputChange}
                  placeholder="Position Title"
                />
              </div>
              <div>
                <Label htmlFor="lengthOfEmployment">Length of Employment</Label>
                <Input
                  id="lengthOfEmployment"
                  name="lengthOfEmployment"
                  value={formData.lengthOfEmployment}
                  onChange={handleInputChange}
                  placeholder="e.g. 5 years"
                />
              </div>
              <div>
                <Label htmlFor="annualIncome">Annual Income</Label>
                <Input
                  id="annualIncome"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                  placeholder="$"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Checklist */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Installation Checklist</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Existing AC</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.existingAC_Y}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, existingAC_Y: checked, existingAC_N: checked ? false : prev.existingAC_N }))}
                    />
                    Y
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.existingAC_N}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, existingAC_N: checked, existingAC_Y: checked ? false : prev.existingAC_Y }))}
                    />
                    N
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">R.O. Granite/Quartz</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.roGranite}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, roGranite: checked }))}
                    />
                    Yes
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Bathrooms</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.bathrooms_Y}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bathrooms_Y: checked, bathrooms_N: checked ? false : prev.bathrooms_N }))}
                    />
                    Y
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.bathrooms_N}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bathrooms_N: checked, bathrooms_Y: checked ? false : prev.bathrooms_Y }))}
                    />
                    N
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Attic Accessible</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.atticAccessible}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, atticAccessible: checked }))}
                    />
                    Yes
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Wi-Fi</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.wifi_Y}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, wifi_Y: checked, wifi_N: checked ? false : prev.wifi_N }))}
                    />
                    Y
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.wifi_N}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, wifi_N: checked, wifi_Y: checked ? false : prev.wifi_Y }))}
                    />
                    N
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Electrical Outlet</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={formData.electricalOutlet}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, electricalOutlet: checked }))}
                    />
                    Yes
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="sqFt" className="text-sm">SqFt</Label>
                <Input
                  id="sqFt"
                  name="sqFt"
                  value={formData.sqFt}
                  onChange={handleInputChange}
                  placeholder="SqFt"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="occupantsNo" className="text-sm">Occupants No.</Label>
                <Input
                  id="occupantsNo"
                  name="occupantsNo"
                  value={formData.occupantsNo}
                  onChange={handleInputChange}
                  placeholder="#"
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Energy Efficiency */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 text-emerald-600">Energy Efficiency</h2>
              <div className="space-y-3">
                {Object.entries(energyEfficiency).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => setEnergyEfficiency(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-16 h-8 text-center"
                      placeholder="Qty"
                    />
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Home Comfort */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-600">Home Comfort</h2>
              <div className="space-y-3">
                {Object.entries(homeComfort).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => setHomeComfort(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-16 h-8 text-center"
                      placeholder="Qty"
                    />
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Smart Solutions */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 text-purple-600">Smart Solutions</h2>
              <div className="space-y-3">
                {Object.entries(smartSolutions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => setSmartSolutions(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-16 h-8 text-center"
                      placeholder="Qty"
                    />
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Special Arrangements */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Special Arrangements - Buyouts - Bills Credits - Discounts</h2>
            <textarea
              className="w-full min-h-[80px] p-3 border rounded-md resize-none"
              value={specialArrangements}
              onChange={(e) => setSpecialArrangements(e.target.value)}
              placeholder="Enter any special arrangements, buyouts, bill credits, or discounts..."
            />
          </CardContent>
        </Card>

        {/* Financial Section */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Clean Energy Savings</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal $</Label>
                <Input
                  id="subtotal"
                  value={financial.subtotal}
                  onChange={(e) => setFinancial(prev => ({ ...prev, subtotal: e.target.value }))}
                  placeholder="$0.00"
                />
              </div>
              <div>
                <Label htmlFor="termMonths">Term Months</Label>
                <Input
                  id="termMonths"
                  value={financial.termMonths}
                  onChange={(e) => setFinancial(prev => ({ ...prev, termMonths: e.target.value }))}
                  placeholder="24"
                />
              </div>
              <div>
                <Label htmlFor="monthlyPayment">Monthly Payment $</Label>
                <Input
                  id="monthlyPayment"
                  value={financial.monthlyPayment}
                  onChange={(e) => setFinancial(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                  placeholder="$0.00"
                />
              </div>
              <div>
                <Label htmlFor="amortizationMonths">Amortization Months</Label>
                <Input
                  id="amortizationMonths"
                  value={financial.amortizationMonths}
                  onChange={(e) => setFinancial(prev => ({ ...prev, amortizationMonths: e.target.value }))}
                  placeholder="180"
                />
              </div>
              <div>
                <Label htmlFor="interestRate">Your Interest Rate</Label>
                <Input
                  id="interestRate"
                  value={financial.interestRate}
                  onChange={(e) => setFinancial(prev => ({ ...prev, interestRate: e.target.value }))}
                  placeholder="0%"
                />
              </div>
              <div>
                <Label htmlFor="adminFee">Admin Fee $</Label>
                <Input
                  id="adminFee"
                  value={financial.adminFee}
                  onChange={(e) => setFinancial(prev => ({ ...prev, adminFee: e.target.value }))}
                  placeholder="99.95"
                />
              </div>
              <div>
                <Label htmlFor="hst">HST $</Label>
                <Input
                  id="hst"
                  value={financial.hst}
                  onChange={(e) => setFinancial(prev => ({ ...prev, hst: e.target.value }))}
                  placeholder="$0.00"
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="rebates">REBATES - $</Label>
                <Input
                  id="rebates"
                  value={financial.rebates}
                  onChange={(e) => setFinancial(prev => ({ ...prev, rebates: e.target.value }))}
                  placeholder="$0.00"
                />
              </div>
            </div>

            {/* Consent checkboxes */}
            <div className="mt-6 space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={financial.acceptPrivacyPolicy}
                  onCheckedChange={(checked) => setFinancial(prev => ({ ...prev, acceptPrivacyPolicy: checked }))}
                  className="mt-0.5"
                />
                <span>I accept the ABODE Financial Privacy Policy. I also confirm that there is no person or company directing me to apply for financing and use this loan on their direction or behalf.</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={financial.electronicConsent}
                  onCheckedChange={(checked) => setFinancial(prev => ({ ...prev, electronicConsent: checked }))}
                  className="mt-0.5"
                />
                <span>I consent to receive Disclosures (including the Loan Agreement, Amendments, Statements and Renewals, notices and other associated documents) electronically.</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={financial.creditConsent}
                  onCheckedChange={(checked) => setFinancial(prev => ({ ...prev, creditConsent: checked }))}
                  className="mt-0.5"
                />
                <span>I agree, acknowledge and represent, that by personally submitting this application Abode Financial is authorized to obtain my credit report from one or more consumer credit reporting agencies.</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Signatures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Signature */}
              <div className="space-y-3">
                <Label>Customer Signature</Label>
                <div
                  onClick={() => setIsCustomerSigPadOpen(true)}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {customerSignature ? (
                    <img src={customerSignature} alt="Customer Signature" className="max-h-20 max-w-full object-contain" />
                  ) : (
                    <span className="text-muted-foreground text-sm">Tap to sign</span>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                  />
                </div>
              </div>

              {/* Agent Signature */}
              <div className="space-y-3">
                <Label>Agent Signature</Label>
                <div
                  onClick={() => setIsAgentSigPadOpen(true)}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {agentSignature ? (
                    <img src={agentSignature} alt="Agent Signature" className="max-h-20 max-w-full object-contain" />
                  ) : (
                    <span className="text-muted-foreground text-sm">Tap to sign</span>
                  )}
                </div>
                <div>
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Agent Name"
                  />
                </div>
              </div>
            </div>

            {/* Sign Date */}
            <div className="mt-4 max-w-xs">
              <Label htmlFor="signDate">Date Signed (DD/MM/YYYY)</Label>
              <Input
                id="signDate"
                type="date"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Generate PDF Button */}
        <div className="flex justify-center py-6">
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            size="lg"
            className="min-w-[200px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Signature Pads */}
      <FullscreenSignaturePad
        isOpen={isCustomerSigPadOpen}
        onClose={() => setIsCustomerSigPadOpen(false)}
        onSave={(dataUrl) => {
          setCustomerSignature(dataUrl);
          setIsCustomerSigPadOpen(false);
        }}
        title="Customer Signature"
      />
      <FullscreenSignaturePad
        isOpen={isAgentSigPadOpen}
        onClose={() => setIsAgentSigPadOpen(false)}
        onSave={(dataUrl) => {
          setAgentSignature(dataUrl);
          setIsAgentSigPadOpen(false);
        }}
        title="Agent Signature"
      />
    </div>
  );
};

export default CustomInvoiceV2Page;
