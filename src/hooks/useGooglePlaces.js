import { useEffect, useRef } from 'react';

// Frontend-safe Google Places API key
const GOOGLE_PLACES_API_KEY = "AIzaSyAHKtdY7NwgxelISC-bek6hgjww3XyJRnQ";

// Helper to mark Places as loaded and notify listeners
const markGooglePlacesLoaded = () => {
  if (typeof window === 'undefined') return;
  if (window.__googlePlacesLoaded) return;
  window.__googlePlacesLoaded = true;
  window.dispatchEvent(new Event('google-places-loaded'));
  console.log('Google Places API marked as loaded');
};

export const useGooglePlacesScript = () => {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;

    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key is missing');
      return;
    }

    // If Places is already available, just mark as loaded
    if (window.google?.maps?.places) {
      console.log('Google Places API already available');
      markGooglePlacesLoaded();
      isLoaded.current = true;
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://maps.googleapis.com/maps/api/js"]'
    );

    const handleScriptLoad = () => {
      console.log('Google Places API loaded successfully');
      markGooglePlacesLoaded();
    };

    if (existingScript) {
      console.log('Google Places API script already present, attaching onload listener');
      // If it's already finished loading, mark immediately
      if (existingScript.readyState === 'complete') {
        handleScriptLoad();
      } else {
        existingScript.addEventListener('load', handleScriptLoad);
      }
      isLoaded.current = true;
      return;
    }

    console.log('Loading Google Places API script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = handleScriptLoad;
    script.onerror = () => console.error('Failed to load Google Places API');
    document.head.appendChild(script);

    isLoaded.current = true;

    return () => {
      // We keep the script for the lifetime of the app
    };
  }, []);
};

export const useGooglePlacesAutocomplete = (inputRef, onPlaceSelected) => {
  useEffect(() => {
    if (!inputRef.current) {
      console.warn('Input ref not available');
      return;
    }

    let autocomplete = null;
    let initialized = false;

    const initAutocomplete = () => {
      if (initialized) return;
      if (!inputRef.current) return;
      if (!window.google?.maps?.places) {
        console.warn('Google Places still not available at init time');
        return;
      }

      console.log('Initializing Google Places Autocomplete for:', inputRef.current.id);

      autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'ca' },
        fields: ['address_components', 'formatted_address'],
        types: ['address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete?.getPlace();
        if (!place?.address_components) return;

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

        if (inputRef.current && place.formatted_address) {
          inputRef.current.value = place.formatted_address;
        }

        onPlaceSelected(addressData);
      });

      initialized = true;
    };

    // If Places is already loaded, init immediately; otherwise wait for custom event
    if (window.__googlePlacesLoaded && window.google?.maps?.places) {
      initAutocomplete();
    } else {
      console.log('Waiting for Google Places to finish loading...');
      const handleLoaded = () => {
        initAutocomplete();
      };
      window.addEventListener('google-places-loaded', handleLoaded);

      return () => {
        window.removeEventListener('google-places-loaded', handleLoaded);
        if (autocomplete && window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(autocomplete);
        }
      };
    }

    return () => {
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [inputRef, onPlaceSelected]);
};
