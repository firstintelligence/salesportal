import { supabase } from "@/integrations/supabase/client";
import { cleanPhoneNumber } from "@/utils/phoneFormat";

/**
 * Finds an existing customer by matching criteria or creates a new one.
 * Matching is done by:
 * 1. Exact first + last name match (case-insensitive)
 * 2. OR exact phone number match (digits only)
 * 3. OR exact email match (case-insensitive)
 * 
 * If a match is found, returns the existing customer ID.
 * If no match is found, creates a new customer and returns the new ID.
 * 
 * @param {Object} customerData - Customer data object
 * @param {string} customerData.firstName - Customer's first name
 * @param {string} customerData.lastName - Customer's last name
 * @param {string} customerData.email - Customer's email (optional)
 * @param {string} customerData.phone - Customer's phone number
 * @param {string} customerData.address - Customer's address
 * @param {string} customerData.city - Customer's city (optional)
 * @param {string} customerData.province - Customer's province (optional)
 * @param {string} customerData.postalCode - Customer's postal code (optional)
 * @param {string} tenantId - The tenant ID to search within
 * @param {string} agentId - The agent ID creating/finding the customer
 * @returns {Promise<{customerId: string, isNew: boolean, error: Error|null}>}
 */
export const findOrCreateCustomer = async (customerData, tenantId, agentId) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    province,
    postalCode
  } = customerData;

  // Clean phone number for comparison (digits only)
  const cleanedPhone = cleanPhoneNumber(phone);
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedFirstName = firstName?.trim().toLowerCase();
  const trimmedLastName = lastName?.trim().toLowerCase();

  try {
    // Build query to find existing customer within the same tenant
    let query = supabase
      .from("customers")
      .select("id, first_name, last_name, email, phone");
    
    // Only filter by tenant if tenantId is provided
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: existingCustomers, error: searchError } = await query;

    if (searchError) {
      console.error("Error searching for existing customer:", searchError);
      return { customerId: null, isNew: false, error: searchError };
    }

    // Find a match by phone or email only (not name)
    let matchedCustomer = null;

    if (existingCustomers && existingCustomers.length > 0) {
      for (const customer of existingCustomers) {
        const customerPhone = cleanPhoneNumber(customer.phone);
        const customerEmail = customer.email?.trim().toLowerCase();

        // Match by exact phone number (digits only, must have at least 10 digits)
        const phoneMatch = 
          cleanedPhone && 
          cleanedPhone.length >= 10 && 
          customerPhone && 
          customerPhone.length >= 10 &&
          customerPhone === cleanedPhone;

        // Match by exact email (case-insensitive)
        const emailMatch = 
          trimmedEmail && 
          trimmedEmail.length > 0 &&
          customerEmail && 
          customerEmail === trimmedEmail;

        if (phoneMatch || emailMatch) {
          matchedCustomer = customer;
          const matchType = phoneMatch ? 'phone' : 'email';
          console.log(`Found existing customer by ${matchType}:`, customer.id);
          break;
        }
      }
    }

    if (matchedCustomer) {
      // Customer exists - update their info with latest data
      // Always overwrite name/address/contact so corrections are applied
      const updateData = { updated_at: new Date().toISOString() };
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (address && address !== 'N/A') updateData.address = address;
      if (city) updateData.city = city;
      if (province) updateData.province = province;
      if (postalCode) updateData.postal_code = postalCode;
      if (email) updateData.email = email;
      if (cleanedPhone && cleanedPhone.length >= 10) {
        updateData.phone = cleanedPhone;
      }

      await supabase
        .from("customers")
        .update(updateData)
        .eq("id", matchedCustomer.id);

      return { 
        customerId: matchedCustomer.id, 
        isNew: false, 
        error: null 
      };
    }

    // No match found - create new customer
    const newCustomerData = {
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: cleanedPhone || phone || 'N/A',
      address: address || 'N/A',
      city: city || null,
      province: province || null,
      postal_code: postalCode || null,
      tenant_id: tenantId || null,
      agent_id: agentId,
    };

    const { data: newCustomer, error: insertError } = await supabase
      .from("customers")
      .insert(newCustomerData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating new customer:", insertError);
      return { customerId: null, isNew: false, error: insertError };
    }

    console.log("Created new customer:", newCustomer.id);
    return { 
      customerId: newCustomer.id, 
      isNew: true, 
      error: null 
    };

  } catch (error) {
    console.error("Error in findOrCreateCustomer:", error);
    return { customerId: null, isNew: false, error };
  }
};
