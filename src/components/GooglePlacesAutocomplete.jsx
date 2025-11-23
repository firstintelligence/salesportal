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
    const loadGooglePlaces = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.error('Google Places API key not found');
        setIsLoaded(true); // Still show fallback input
        return;
      }

      // Check if already loaded
      if (window.google?.maps?.places?.Autocomplete) {
        setIsLoaded(true);
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        return;
      }

      // Load the Places library with callback
      window.initGooglePlaces = () => {
        setIsLoaded(true);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Places API');
        setIsLoaded(true); // Show fallback input
      };
      document.head.appendChild(script);
    };

    loadGooglePlaces();
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.google?.maps?.places) return;

    // Create standard input with Autocomplete
    const createAutocomplete = () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = id;
      input.name = name;
      input.placeholder = 'Start typing address...';
      input.className = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
      if (value) {
        input.value = value;
      }
      
      // Clear container and add input
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(input);

      // Create Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'ca' },
        fields: ['address_components', 'formatted_address']
      });

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
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

      // Keep input value in sync
      input.addEventListener('input', (e) => {
        onChange({ target: { name, value: e.target.value } });
      });
    };

    createAutocomplete();
  }, [isLoaded]);

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
