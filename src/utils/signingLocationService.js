import { supabase } from "@/integrations/supabase/client";

/**
 * Captures detailed location data for document signing purposes
 * Uses IP-based geolocation as primary source for reliability
 */
export const captureSigningLocation = async () => {
  const locationData = {
    ip_address: null,
    latitude: null,
    longitude: null,
    city: null,
    region: null,
    country: null,
    postal_code: null,
    timezone: null,
    isp: null,
    location_string: 'Location unavailable',
    user_agent: navigator.userAgent
  };

  try {
    // Primary: IP-based geolocation (more reliable, doesn't require permission)
    const response = await fetch('https://ipapi.co/json/');
    const ipData = await response.json();
    
    if (ipData && !ipData.error) {
      locationData.ip_address = ipData.ip || null;
      locationData.latitude = ipData.latitude || null;
      locationData.longitude = ipData.longitude || null;
      locationData.city = ipData.city || null;
      locationData.region = ipData.region || null;
      locationData.country = ipData.country_name || null;
      locationData.postal_code = ipData.postal || null;
      locationData.timezone = ipData.timezone || null;
      locationData.isp = ipData.org || null;
      
      // Build location string
      const locationParts = [
        ipData.city,
        ipData.region,
        ipData.country_name,
        ipData.postal
      ].filter(Boolean);
      
      locationData.location_string = locationParts.length > 0 
        ? locationParts.join(', ') 
        : 'Location unavailable';
    }
  } catch (error) {
    console.error('Error capturing IP location:', error);
  }

  // Secondary: Try browser geolocation for more precise coordinates
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      // Update with more precise coordinates if available
      locationData.latitude = position.coords.latitude;
      locationData.longitude = position.coords.longitude;
    } catch (geoError) {
      // Browser geolocation failed, keep IP-based coordinates
      console.log('Browser geolocation unavailable, using IP-based location');
    }
  }

  return locationData;
};

/**
 * Records a document signature with location data to the backend
 */
export const recordDocumentSignature = async ({
  documentType,
  documentId,
  customerId = null,
  customerName = null,
  agentId,
  tenantId = null,
  signatureType = 'customer'
}) => {
  try {
    // Capture location data
    const locationData = await captureSigningLocation();
    
    // Build the signature record
    const signatureRecord = {
      document_type: documentType,
      document_id: documentId,
      customer_id: customerId,
      customer_name: customerName,
      agent_id: agentId,
      tenant_id: tenantId,
      signature_type: signatureType,
      signed_at: new Date().toISOString(),
      ...locationData
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
 * Gets signing location data formatted as a string for display
 */
export const getSigningLocationString = async () => {
  const locationData = await captureSigningLocation();
  return locationData.location_string;
};
