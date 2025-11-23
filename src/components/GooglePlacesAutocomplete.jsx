import React, { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';

const GooglePlacesAutocomplete = ({ 
  id, 
  label, 
  value, 
  onChange, 
  name, 
  onAddressSelect,
  required = false
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps Places library
    const loadGooglePlaces = async () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.error('Google Places API key not found');
        return;
      }

      // Load the Places library
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    // Create the PlaceAutocompleteElement
    const createAutocomplete = async () => {
      await window.google.maps.importLibrary('places');
      
      const autocompleteElement = document.createElement('gmp-place-autocomplete');
      autocompleteElement.setAttribute('id', `${id}-autocomplete`);
      autocompleteElement.setAttribute('placeholder', 'Start typing address...');
      
      // Style the component
      autocompleteElement.style.width = '100%';
      autocompleteElement.style.height = '40px';
      
      // Restrict to Canadian addresses
      const autocompleteWidget = autocompleteElement;
      autocompleteWidget.componentRestrictions = { country: 'ca' };
      autocompleteWidget.fields = ['address_components', 'formatted_address'];

      // Clear container and add element
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(autocompleteElement);

      // Listen for place selection
      autocompleteElement.addEventListener('gmp-placeselect', async (event) => {
        const place = event.detail.place;
        
        if (!place.address_components) {
          return;
        }

        // Parse address components
        const addressData = {
          street: '',
          city: '',
          province: '',
          postalCode: ''
        };

        let streetNumber = '';
        let route = '';

        place.address_components.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('locality')) {
            addressData.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            addressData.province = component.short_name;
          }
          if (types.includes('postal_code')) {
            addressData.postalCode = component.long_name;
          }
        });

        addressData.street = [streetNumber, route].filter(Boolean).join(' ');

        // Update form field
        onChange({ target: { name, value: addressData.street } });

        // Call the address select callback
        if (onAddressSelect) {
          onAddressSelect(addressData);
        }
      });
    };

    createAutocomplete();
  }, [isLoaded, id, name, onChange, onAddressSelect]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label} {required && '*'}</Label>}
      <div 
        ref={containerRef}
        className="relative w-full"
      >
        {!isLoaded && (
          <input
            type="text"
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder="Loading Google Places..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled
          />
        )}
      </div>
    </div>
  );
};

export default GooglePlacesAutocomplete;
