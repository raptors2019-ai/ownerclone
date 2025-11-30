import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const diagnostics = {
    apiKeyConfigured: !!apiKey,
    apiKeyValue: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : 'NOT SET',
    timestamp: new Date().toISOString(),
    tests: {} as Record<string, any>,
  };

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return NextResponse.json({
      ...diagnostics,
      error: 'API key not configured',
      solution: 'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local',
    });
  }

  // Test 1: Check if API key is valid format
  diagnostics.tests.apiKeyFormat = {
    valid: apiKey.startsWith('AIza'),
    message: 'API key should start with "AIza"',
  };

  // Test 2: Test Maps JavaScript API
  try {
    const mapsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`,
      { method: 'HEAD' }
    );
    diagnostics.tests.mapsJavaScriptAPI = {
      status: mapsResponse.status,
      ok: mapsResponse.ok,
      message: mapsResponse.ok ? 'API is accessible' : `Error: ${mapsResponse.statusText}`,
    };
  } catch (error) {
    diagnostics.tests.mapsJavaScriptAPI = {
      error: String(error),
      message: 'Failed to connect to Maps API',
    };
  }

  // Test 3: Test Geocoding API
  try {
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Toronto,ON&key=${apiKey}`
    );
    const geocodeData = await geocodeResponse.json();
    diagnostics.tests.geocodingAPI = {
      status: geocodeResponse.status,
      ok: geocodeResponse.ok,
      errorMessage: geocodeData.error_message || 'None',
      results: geocodeData.results?.length || 0,
      message: geocodeData.error_message
        ? `❌ ${geocodeData.error_message}`
        : `✅ API works (found ${geocodeData.results?.length || 0} results)`,
    };
  } catch (error) {
    diagnostics.tests.geocodingAPI = {
      error: String(error),
      message: 'Failed to test Geocoding API',
    };
  }

  // Test 4: Test Places API (indirectly)
  try {
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=1600+Amphitheatre+Parkway&key=${apiKey}`
    );
    const placesData = await placesResponse.json();
    diagnostics.tests.placesAPI = {
      status: placesResponse.status,
      ok: placesResponse.ok,
      errorMessage: placesData.error_message || 'None',
      predictions: placesData.predictions?.length || 0,
      message: placesData.error_message
        ? `❌ ${placesData.error_message}`
        : `✅ API works (found ${placesData.predictions?.length || 0} predictions)`,
    };
  } catch (error) {
    diagnostics.tests.placesAPI = {
      error: String(error),
      message: 'Failed to test Places API',
    };
  }

  return NextResponse.json({
    ...diagnostics,
    summary: {
      allTestsPassed: Object.values(diagnostics.tests).every((t: any) => t.ok !== false),
      nextSteps: getNextSteps(diagnostics.tests),
    },
  });
}

function getNextSteps(tests: Record<string, any>): string[] {
  const steps: string[] = [];

  if (!tests.apiKeyFormat?.valid) {
    steps.push('❌ API key format is invalid - should start with "AIza"');
  }

  if (tests.mapsJavaScriptAPI?.status === 403) {
    steps.push('❌ Maps JavaScript API is not enabled in Google Cloud Console');
  }

  if (tests.geocodingAPI?.errorMessage?.includes('not enabled')) {
    steps.push('❌ Geocoding API is not enabled in Google Cloud Console');
  }

  if (tests.placesAPI?.errorMessage?.includes('not enabled')) {
    steps.push('❌ Places API is not enabled in Google Cloud Console');
  }

  if (
    tests.geocodingAPI?.errorMessage?.includes('API key') ||
    tests.placesAPI?.errorMessage?.includes('API key')
  ) {
    steps.push('⚠️ API key may have restrictions - check Credentials in Google Cloud Console');
  }

  if (steps.length === 0) {
    steps.push('✅ All tests passed! Google Maps should work.');
  }

  return steps;
}
