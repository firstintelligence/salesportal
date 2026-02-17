import React from 'react';
import { capitalizeWords, formatPostalCode } from '../utils/inputFormatting';
import { format, parse } from 'date-fns';

// Format date for display: "Jan 11, 2026"
const formatDateDisplay = (dateValue) => {
  if (!dateValue) return '';
  try {
    const date = parse(dateValue, 'yyyy-MM-dd', new Date());
    return format(date, 'MMM dd, yyyy');
  } catch {
    return dateValue;
  }
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

  // For date type, show formatted display with hidden native input
  if (isDateType) {
    return (
      <div className="relative">
        {/* Hidden native date input for picking */}
        <input
          type="date"
          id={id}
          name={name}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        {/* Display formatted date */}
        <div
          className={`flex items-center px-2.5 w-full min-h-[40px] md:h-[40px] h-[48px] text-xs md:text-sm text-gray-900 bg-white rounded-lg border border-gray-300 ${disabled ? 'cursor-not-allowed bg-gray-50' : ''} ${className}`}
        >
          <span className="w-full text-center">{formatDateDisplay(value)}</span>
        </div>
        <label
          htmlFor={id}
          className="absolute text-sm duration-300 transform z-10 origin-[0] bg-white px-2 start-1 pointer-events-none whitespace-nowrap scale-75 -translate-y-4 top-2 text-gray-500"
        >
          {label}
        </label>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        className={`block px-2.5 pb-2.5 pt-4 w-full min-h-[40px] md:h-[40px] h-[48px] text-xs md:text-sm text-gray-900 bg-white rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
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
