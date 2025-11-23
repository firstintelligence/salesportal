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

    // Check if already loaded
    if (window.google?.maps?.places) {
      console.log('Google Places API already available');
      isLoaded.current = true;
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript) {
      console.log('Google Places API script already loading...');
      isLoaded.current = true;
      return;
    }

    console.log('Loading Google Places API...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&callback=Function.prototype`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Places API loaded successfully');
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Places API');
    };
    
    document.head.appendChild(script);
    isLoaded.current = true;
  }, []);
};

export const useGooglePlacesAutocomplete = (inputRef, onPlaceSelected) => {
  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    let autocomplete = null;
    let checkInterval = null;

    // Wait for Google Places to be available
    const initializeAutocomplete = () => {
      if (!window.google?.maps?.places) {
        return false;
      }

      if (autocomplete) {
        return true; // Already initialized
      }

      try {
        console.log('Initializing Places Autocomplete for:', inputRef.current.id);

        // Create autocomplete instance
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'ca' },
          fields: ['address_components', 'formatted_address'],
          types: ['address'],
        });

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place || !place.address_components) {
            console.warn('No address components in selected place');
            return;
          }

          const addressData = {
            address: '',
            city: '',
            province: '',
            postalCode: '',
          };

          // Extract address components
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

          console.log('Address selected:', addressData);
          onPlaceSelected(addressData);
        });

        return true;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
        return false;
      }
    };

    // Try to initialize immediately
    if (!initializeAutocomplete()) {
      // If not ready, poll until Google Places is available
      console.log('Waiting for Google Places API to load...');
      checkInterval = setInterval(() => {
        if (initializeAutocomplete()) {
          clearInterval(checkInterval);
        }
      }, 100);
    }

    // Cleanup
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [inputRef, onPlaceSelected]);
};
