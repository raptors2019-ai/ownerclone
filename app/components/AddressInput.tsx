'use client';

import { useEffect, useRef, useState } from 'react';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    google: any;
    _googleMapsLoaded: boolean;
  }
}

export default function AddressInput({
  value,
  onChange,
  placeholder = '123 Main St, Apt 4B, Mississauga, ON L5A 1A1',
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setError('Google Maps API key not configured - make sure you enabled Maps JavaScript API');
      setIsLoaded(true);
      return;
    }

    const initializeAutocomplete = () => {
      if (inputRef.current && window.google?.maps?.places) {
        try {
          if (autocompleteRef.current) {
            return; // Already initialized
          }

          const autocomplete = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              // Allow both US and Canadian addresses for testing
              componentRestrictions: { country: ['us', 'ca'] },
              fields: ['formatted_address', 'address_components'],
              types: ['address'],
            }
          );

          autocompleteRef.current = autocomplete;

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place?.formatted_address) {
              onChange(place.formatted_address);
            }
          });

          setIsLoaded(true);
        } catch (err) {
          console.error('Error setting up autocomplete:', err);
          setError('Address search unavailable');
          setIsLoaded(true);
        }
      }
    };

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places && !window._googleMapsLoaded) {
      initializeAutocomplete();
      return;
    }

    // Only load script if not already loaded
    if (window._googleMapsLoaded) {
      initializeAutocomplete();
      return;
    }

    // Load Google Maps script
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );

    if (existingScript) {
      // Script already exists, wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle);
          initializeAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }

    // Create new script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window._googleMapsLoaded = true;
      initializeAutocomplete();
    };

    script.onerror = () => {
      console.error('Error loading Google Maps script');
      setError('Failed to load Google Maps - check your API key and ensure Maps JavaScript API is enabled');
      setIsLoaded(true);
    };

    document.head.appendChild(script);
  }, [onChange]);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-4 text-lg text-gray-900 bg-transparent border-0 rounded-xl focus:outline-none font-medium placeholder-gray-500"
        placeholder={placeholder}
        required
      />
      {error && (
        <p className="mt-2 text-sm text-orange-600">
          {error} - Address search unavailable, but you can still type manually
        </p>
      )}
      {!isLoaded && !error && (
        <p className="mt-2 text-xs text-gray-500">Loading address suggestions...</p>
      )}
    </div>
  );
}
