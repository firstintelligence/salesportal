import React, { useState, useEffect, useRef } from 'react';

const AddressAutocomplete = ({ 
  id, 
  label, 
  value, 
  onChange, 
  name, 
  onAddressSelect,
  className = '' 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ', Canada'
        )}&countrycodes=ca&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(e);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  const formatAddressDisplay = (suggestion) => {
    const addr = suggestion.address;
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || '';
    const province = addr.state || '';
    const postalCode = addr.postcode || '';
    
    return [street, city, province, postalCode].filter(Boolean).join(', ');
  };

  const handleSelectSuggestion = (suggestion) => {
    const address = suggestion.address;
    const selectedAddress = {
      street: [address.house_number, address.road].filter(Boolean).join(' '),
      city: address.city || address.town || address.village || '',
      province: address.state || '',
      postalCode: address.postcode || ''
    };

    setInputValue(selectedAddress.street);
    onChange({ target: { name, value: selectedAddress.street } });
    setIsOpen(false);
    setSuggestions([]);

    if (onAddressSelect) {
      onAddressSelect(selectedAddress);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        id={id}
        name={name}
        className={`block px-2.5 pb-2.5 pt-4 w-full min-h-[40px] md:h-[40px] h-[48px] md:text-sm text-base text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer ${className}`}
        placeholder=" "
        value={inputValue}
        onChange={handleInputChange}
        autoComplete="off"
      />
      <label
        htmlFor={id}
        className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1 pointer-events-none"
      >
        {label}
      </label>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="text-sm text-gray-900">{formatAddressDisplay(suggestion)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
