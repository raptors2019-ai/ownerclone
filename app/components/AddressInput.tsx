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

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setError('Google Maps API key not configured');
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (inputRef.current && window.google) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              componentRestrictions: { country: 'ca' }, // Canada
              fields: ['formatted_address', 'address_components'],
              types: ['address'],
            }
          );

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              onChange(place.formatted_address);
            }
          });
        } catch (err) {
          console.error('Error setting up autocomplete:', err);
          setError('Failed to initialize address search');
        }
      }
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Error loading Google Maps script');
      setError('Failed to load Google Maps');
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup - remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onChange]);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
        placeholder={placeholder}
        required
      />
      {error && (
        <p className="mt-2 text-sm text-orange-600">
          {error} - Address search unavailable, but you can still type manually
        </p>
      )}
      {!isLoaded && !error && (
        <p className="mt-2 text-sm text-gray-500">Loading address search...</p>
      )}
    </div>
  );
}
