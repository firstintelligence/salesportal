import { useEffect, useRef } from 'react';

const GOOGLE_PLACES_API_KEY = "AIzaSyAHKtdY7NwgxelISC-bek6hgjww3XyJRnQ";

export const useGooglePlacesScript = () => {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key is missing');
      return;
    }

    console.log('Loading Google Places API...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => console.log('Google Places API loaded successfully');
    script.onerror = () => console.error('Failed to load Google Places API');
    document.head.appendChild(script);
    
    isLoaded.current = true;

    return () => {
      // Cleanup if needed
    };
  }, []);
};

export const useGooglePlacesAutocomplete = (inputRef, onPlaceSelected) => {
  useEffect(() => {
    if (!inputRef.current) {
      console.warn('Input ref not available');
      return;
    }
    
    if (!window.google?.maps?.places) {
      console.warn('Google Places API not loaded yet');
      return;
    }

    console.log('Initializing autocomplete for:', inputRef.current.id);
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
