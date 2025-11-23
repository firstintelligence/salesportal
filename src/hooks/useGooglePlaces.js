import { useEffect, useRef } from 'react';

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

export const useGooglePlacesScript = () => {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current || !GOOGLE_PLACES_API_KEY) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    isLoaded.current = true;

    return () => {
      // Cleanup if needed
    };
  }, []);
};

export const useGooglePlacesAutocomplete = (inputRef, onPlaceSelected) => {
  useEffect(() => {
    if (!inputRef.current || !window.google || !GOOGLE_PLACES_API_KEY) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ca' },
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const addressData = {
        address: '',
        city: '',
        province: '',
        postalCode: '',
      };

      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          addressData.address = component.long_name + ' ';
        }
        if (types.includes('route')) {
          addressData.address += component.long_name;
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

      onPlaceSelected(addressData);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [inputRef, onPlaceSelected]);
};
