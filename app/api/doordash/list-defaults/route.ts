import { NextResponse } from 'next/server';
import { createDoorDashJWT } from '@/lib/doordash-jwt';

/**
 * GET /api/doordash/list-defaults
 * Lists the default Business and Store
 * Every DoorDash account auto-has these - no creation needed!
 */
export async function GET() {
  try {
    const token = createDoorDashJWT();

    // List all businesses (should show "default")
    const businessesRes = await fetch(
      'https://openapi.doordash.com/drive/v1/businesses',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const businesses = await businessesRes.json();

    console.log('Businesses Response:', {
      status: businessesRes.status,
      data: businesses,
    });

    // List stores under "default" business
    const storesRes = await fetch(
      'https://openapi.doordash.com/drive/v1/businesses/default/stores',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const stores = await storesRes.json();

    console.log('Stores Response:', {
      status: storesRes.status,
      data: stores,
    });

    return NextResponse.json(
      {
        success: true,
        businesses: businesses.results || [],
        stores: stores.results || [],
        message: 'Use businessId: "default" and storeId: "default" in delivery quotes',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List defaults error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list defaults',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
