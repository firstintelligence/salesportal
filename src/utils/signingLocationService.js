import { supabase } from "@/integrations/supabase/client";

/**
 * TEMPORARILY DISABLED - IP location tracking is disabled
 * Returns empty/stub location data
 */
export const captureSigningLocation = async () => {
  // Location tracking temporarily disabled
  return {
    ip_address: null,
    latitude: null,
    longitude: null,
    city: null,
    region: null,
    country: null,
    postal_code: null,
    timezone: null,
    isp: null,
    location_string: null,
    user_agent: navigator.userAgent
  };
};

/**
 * TEMPORARILY DISABLED - Records a document signature without location data
 */
export const recordDocumentSignature = async ({
  documentType,
  documentId,
  customerId = null,
  customerName = null,
  agentId,
  tenantId = null,
  signatureType = 'customer',
  documentUrl = null
}) => {
  try {
    // Build the signature record without location data
    const signatureRecord = {
      document_type: documentType,
      document_id: documentId,
      customer_id: customerId,
      customer_name: customerName,
      agent_id: agentId,
      tenant_id: tenantId,
      signature_type: signatureType,
      signed_at: new Date().toISOString(),
      document_url: documentUrl,
      // Location data disabled
      ip_address: null,
      latitude: null,
      longitude: null,
      city: null,
      region: null,
      country: null,
      postal_code: null,
      timezone: null,
      isp: null,
      location_string: null,
      user_agent: navigator.userAgent
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('document_signatures')
      .insert(signatureRecord)
      .select()
      .single();
    
    if (error) {
      console.error('Error recording document signature:', error);
      return { success: false, error };
    }
    
    console.log('Document signature recorded:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error in recordDocumentSignature:', error);
    return { success: false, error };
  }
};

/**
 * TEMPORARILY DISABLED - Returns null
 */
export const getSigningLocationString = async () => {
  return null;
};
