import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import IDScanner from "@/components/qualify/IDScanner";
import IDScanResult from "@/components/qualify/IDScanResult";
import ApprovalScreen from "@/components/qualify/ApprovalScreen";
import { findOrCreateCustomer } from "@/utils/customerService";

const QualifyPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [step, setStep] = useState('scanner'); // 'scanner' | 'result' | 'approved'
  const [scanData, setScanData] = useState(null);
  const [approvedProfile, setApprovedProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const authenticated = localStorage.getItem('authenticated');
    
    if (!authenticated) {
      navigate('/');
      return;
    }
  }, [navigate]);

  // Helper to convert ALL CAPS text to Title Case
  const toTitleCase = (str) => {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleScanComplete = (data) => {
    // Apply title case to text fields that may come back fully capitalized
    const transformedData = {
      ...data,
      firstName: toTitleCase(data.firstName),
      lastName: toTitleCase(data.lastName),
      address: toTitleCase(data.address),
      city: toTitleCase(data.city),
    };
    setScanData(transformedData);
    setStep('result');
  };

  const handleEditData = (editedData) => {
    setScanData(editedData);
  };

  const handleApprove = async (data) => {
    setIsSubmitting(true);
    
    try {
      const agentId = localStorage.getItem('agentId');
      
      // Get valid tenant_id (null if super admin "all tenants" view)
      const validTenantId = tenant?.isAllTenants ? null : tenant?.id || null;
      
      // Find existing customer or create new one
      // Matches by: exact name, exact phone, or exact email
      const { customerId, isNew, error: customerFindError } = await findOrCreateCustomer(
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: null, // Email not available from ID
          phone: 'N/A', // Phone not available from ID
          address: data.address,
          city: data.city,
          province: data.province || 'ON',
          postalCode: data.postalCode,
        },
        validTenantId,
        agentId
      );

      if (customerFindError) {
        console.error('Error finding/creating customer:', customerFindError);
        throw new Error('Failed to create customer profile');
      }
      
      if (isNew) {
        console.log('Created new customer from ID scan:', customerId);
      } else {
        console.log('Found existing customer from ID scan:', customerId);
      }

      // Generate filename: LastName_FirstName_Address
      const sanitizeName = (str) => (str || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
      const fileName = `${sanitizeName(data.lastName)}_${sanitizeName(data.firstName)}_${sanitizeName(data.address)}_${Date.now()}.jpg`;

      // Upload ID image to storage if we have it
      let imagePath = null;
      if (data.imageBase64) {
        // Convert base64 to blob
        const base64Data = data.imageBase64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`id-scans/${fileName}`, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue without image - not critical
        } else {
          imagePath = uploadData?.path;
        }
      }

      // Create ID scan record
      const { error: scanError } = await supabase
        .from('id_scans')
        .insert({
          customer_id: customerId,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth || null,
          id_number: data.idNumber,
          id_expiry: data.idExpiry || null,
          address: data.address,
          city: data.city,
          province: data.province || 'ON',
          postal_code: data.postalCode,
          id_type: data.idType || 'Ontario Driver\'s License',
          id_image_path: imagePath,
          status: 'approved',
          scanned_by: agentId,
          tenant_id: validTenantId
        });

      if (scanError) {
        console.error('Error saving ID scan:', scanError);
        // Don't throw - customer was created successfully
      }

      setApprovedProfile({
        ...data,
        customerId: customerId
      });
      setStep('approved');
      toast.success('Profile created successfully!');

    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setScanData(null);
    setApprovedProfile(null);
    setStep('scanner');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              <span className="font-semibold">ID Qualify</span>
            </div>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            {step === 'scanner' && (
              <IDScanner 
                onScanComplete={handleScanComplete}
                onCancel={() => navigate('/landing')}
              />
            )}

            {step === 'result' && scanData && (
              <IDScanResult 
                scanData={scanData}
                onApprove={handleApprove}
                onEdit={handleEditData}
                isSubmitting={isSubmitting}
              />
            )}

            {step === 'approved' && approvedProfile && (
              <ApprovalScreen 
                profileData={approvedProfile}
                onDone={() => navigate('/landing')}
                onScanAnother={handleReset}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QualifyPage;
