import React, { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Simple, reliable Google Places Autocomplete bound to a normal React input
const GooglePlacesAutocomplete = ({
  id,
  label,
  value,
  onChange,
  name,
  onAddressSelect,
  required = false,
}) => {
  const inputRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Places script once
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error("Google Places API key not found");
      return;
    }

    // Already loaded
    if (window.google?.maps?.places?.Autocomplete) {
      setIsLoaded(true);
      return;
    }

    // Already loading
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      return;
    }

    // Load script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Failed to load Google Places API");
    document.head.appendChild(script);
  }, []);

  // Attach Autocomplete to the input once Maps is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return;

    // Guard so we only initialize once per input
    if (inputRef.current.__autocompleteInitialized) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: "ca" },
        fields: ["address_components", "formatted_address"],
        types: ["address"],
      }
    );

    inputRef.current.__autocompleteInitialized = true;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const addressData = {
        street: "",
        city: "",
        province: "",
        postalCode: "",
      };

      let streetNumber = "";
      let route = "";

      place.address_components.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        }
        if (types.includes("route")) {
          route = component.long_name;
        }
        if (types.includes("locality")) {
          addressData.city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          addressData.province = component.short_name;
        }
        if (types.includes("postal_code")) {
          addressData.postalCode = component.long_name;
        }
      });

      addressData.street = [streetNumber, route].filter(Boolean).join(" ");

      // Update main address field in React form
      if (onChange) {
        onChange({ target: { name, value: addressData.street } });
      }

      if (onAddressSelect) {
        onAddressSelect(addressData);
      }
    });
  }, [isLoaded, name, onChange, onAddressSelect]);

  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label} {required && "*"}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete="off"
        placeholder="Start typing address..."
      />
    </div>
  );
};

export default GooglePlacesAutocomplete;
