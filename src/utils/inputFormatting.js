// Centralized input formatting utilities for consistent masking across the CRM

/**
 * Capitalize first letter of each word (for names, addresses)
 */
export const capitalizeWords = (str) => {
  if (!str) return str;
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Capitalize just the first letter (for city names)
 */
export const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format Canadian postal code: uppercase, space after 3rd char (e.g., A1A 1A1)
 */
export const formatPostalCode = (str) => {
  if (!str) return str;
  const cleaned = str.replace(/\s/g, '').toUpperCase().slice(0, 6);
  if (cleaned.length > 3) {
    return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
  }
  return cleaned;
};

/**
 * Format phone number as (XXX) XXX-XXXX
 */
export const formatPhoneNumber = (str) => {
  if (!str) return str;
  let digits = str.replace(/\D/g, '');
  // Strip leading country code "1" if present (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  let formatted = '';
  if (digits.length > 0) {
    formatted = '(' + digits.slice(0, 3);
    if (digits.length > 3) {
      formatted += ') ' + digits.slice(3, 6);
      if (digits.length > 6) {
        formatted += '-' + digits.slice(6);
      }
    }
  }
  return formatted;
};

/**
 * Helper to create onChange handler for different field types
 */
export const getFormattedValue = (value, fieldType) => {
  switch (fieldType) {
    case 'phone':
      return formatPhoneNumber(value);
    case 'postalCode':
      return formatPostalCode(value);
    case 'name':
    case 'address':
      return capitalizeWords(value);
    case 'city':
      return capitalizeWords(value);
    default:
      return value;
  }
};
