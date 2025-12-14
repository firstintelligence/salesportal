import React from 'react';

// Capitalize first letter of each word
const capitalizeWords = (str) => {
  if (!str) return str;
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Format Canadian postal code: uppercase, space after 3rd char (e.g., A1A 1A1)
const formatPostalCode = (str) => {
  if (!str) return str;
  // Remove all spaces and uppercase
  const cleaned = str.replace(/\s/g, '').toUpperCase();
  // Add space after 3rd character if length > 3
  if (cleaned.length > 3) {
    return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
  }
  return cleaned;
};

const FloatingLabelInput = ({ 
  id, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  onBlur, 
  name, 
  className = '', 
  disabled = false,
  autoCapitalize = true,
  isPostalCode = false
}) => {
  // For date inputs or when value exists, always show label in floated position
  const hasValue = value !== undefined && value !== null && value !== '';
  const isDateType = type === 'date';
  const shouldFloatLabel = hasValue || isDateType;

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    if (isPostalCode) {
      // For postal code: uppercase and format
      newValue = formatPostalCode(newValue);
    } else if (autoCapitalize && type === 'text' && name !== 'email') {
      // Auto-capitalize first letter of each word (except email)
      newValue = capitalizeWords(newValue);
    }
    
    onChange({ target: { name: e.target.name, value: newValue } });
  };

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        className={`block px-2.5 pb-2.5 pt-4 w-full min-h-[40px] md:h-[40px] h-[48px] text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''} ${className}`}
        placeholder=" "
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        spellCheck="false"
        aria-autocomplete="none"
      />
      <label
        htmlFor={id}
        className={`absolute text-sm duration-300 transform z-10 origin-[0] bg-white px-2 start-1 pointer-events-none whitespace-nowrap ${
          shouldFloatLabel 
            ? 'scale-75 -translate-y-4 top-2 text-gray-500 peer-focus:text-blue-600' 
            : 'text-gray-500 scale-100 -translate-y-1/2 top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-blue-600'
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingLabelInput;
