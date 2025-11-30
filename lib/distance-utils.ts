/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      return null;
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      console.warn('Geocoding failed:', data.status);
      return null;
    }

    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two addresses using Google Maps Geocoding API + Haversine formula
 * Falls back to Haversine with sample coordinates if API unavailable
 */
export async function calculateDistance(
  originAddress: string,
  destinationAddress: string
): Promise<{ distanceKm: number; durationMinutes: number } | null> {
  try {
    // Try to geocode both addresses
    const [originCoords, destCoords] = await Promise.all([
      geocodeAddress(originAddress),
      geocodeAddress(destinationAddress),
    ]);

    if (originCoords && destCoords) {
      // Calculate distance using Haversine formula
      const distanceKm = haversineDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);

      // Estimate duration: average speed 40 km/h in urban area
      const durationMinutes = Math.ceil((distanceKm / 40) * 60);

      console.log('Distance calculated:', {
        from: originAddress,
        to: destinationAddress,
        distanceKm: distanceKm.toFixed(2),
        durationMinutes,
      });

      return {
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMinutes,
      };
    }

    // Fallback: Use distance matrix API if geocoding failed
    console.log('Geocoding unavailable, trying Distance Matrix API');
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', originAddress);
    url.searchParams.append('destinations', destinationAddress);
    url.searchParams.append('key', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!);
    url.searchParams.append('units', 'metric');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      const distanceKm = element.distance.value / 1000;
      const durationMinutes = Math.ceil(element.duration.value / 60);

      return {
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMinutes,
      };
    }

    console.error('Both distance methods failed');
    return null;
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
}

/**
 * Calculate delivery fee based on distance
 * $5 base + $1 per km over 2km
 */
export function calculateDeliveryFee(distanceKm: number): number {
  const baseFee = 5.0;
  const perKmRate = 1.0;
  const minimumDistance = 2;

  if (distanceKm <= minimumDistance) {
    return baseFee;
  }

  return baseFee + (distanceKm - minimumDistance) * perKmRate;
}
