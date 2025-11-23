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

    console.log('Initializing custom Places Autocomplete for:', inputRef.current.id);

    const autocompleteService = new window.google.maps.places.AutocompleteService();
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));

    const dropdown = document.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '9999';
    dropdown.style.background = '#ffffff';
    dropdown.style.border = '1px solid #e5e7eb';
    dropdown.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
    dropdown.style.borderRadius = '0.375rem';
    dropdown.style.padding = '0.25rem 0';
    dropdown.style.fontSize = '0.875rem';
    dropdown.style.maxHeight = '240px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.display = 'none';

    document.body.appendChild(dropdown);

    const positionDropdown = () => {
      const rect = inputRef.current.getBoundingClientRect();
      dropdown.style.minWidth = rect.width + 'px';
      dropdown.style.left = rect.left + window.scrollX + 'px';
      dropdown.style.top = rect.bottom + window.scrollY + 'px';
    };

    const clearDropdown = () => {
      dropdown.innerHTML = '';
      dropdown.style.display = 'none';
    };

    const handlePredictionClick = (prediction) => {
      clearDropdown();

      placesService.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['address_components', 'formatted_address'],
        },
        (place, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
            console.warn('Place details request failed:', status);
            return;
          }

          const addressData = {
            address: place.formatted_address || '',
            city: '',
            province: '',
            postalCode: '',
          };

          place.address_components?.forEach((component) => {
            const types = component.types;

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

          if (inputRef.current) {
            inputRef.current.value = addressData.address;
          }

          onPlaceSelected(addressData);
        }
      );
    };

    let debounceTimer;

    const handleInput = (event) => {
      const value = event.target.value;

      if (!value || value.length < 3) {
        clearDropdown();
        return;
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        positionDropdown();

        autocompleteService.getPlacePredictions(
          {
            input: value,
            componentRestrictions: { country: 'ca' },
            types: ['address'],
          },
          (predictions, status) => {
            if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
              clearDropdown();
              return;
            }

            dropdown.innerHTML = '';

            predictions.forEach((prediction) => {
              const item = document.createElement('div');
              item.textContent = prediction.description;
              item.style.padding = '0.35rem 0.75rem';
              item.style.cursor = 'pointer';

              item.addEventListener('mouseenter', () => {
                item.style.background = '#f3f4f6';
              });

              item.addEventListener('mouseleave', () => {
                item.style.background = '#ffffff';
              });

              item.addEventListener('mousedown', (e) => {
                // Prevent input from losing focus before click is handled
                e.preventDefault();
              });

              item.addEventListener('click', () => handlePredictionClick(prediction));

              dropdown.appendChild(item);
            });

            dropdown.style.display = 'block';
          }
        );
      }, 250);
    };

    const handleClickOutside = (event) => {
      if (event.target !== inputRef.current && !dropdown.contains(event.target)) {
        clearDropdown();
      }
    };

    inputRef.current.addEventListener('input', handleInput);
    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);
    document.addEventListener('click', handleClickOutside);

    return () => {
      clearTimeout(debounceTimer);
      clearDropdown();
      document.body.removeChild(dropdown);
      inputRef.current?.removeEventListener('input', handleInput);
      window.removeEventListener('resize', positionDropdown);
      window.removeEventListener('scroll', positionDropdown, true);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [inputRef, onPlaceSelected]);
};
