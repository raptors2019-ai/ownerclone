import { NextResponse } from 'next/server';
import { createDoorDashJWT } from '@/lib/doordash-jwt';

interface CreateStoreRequest {
  businessId: string;
  storeExternalId?: string;
  storeName?: string;
  address?: string;
  phone?: string;
}

/**
 * POST /api/doordash/create-store
 * Creates a DoorDash Store - THIS FIXES PHONE/DISTANCE ERRORS
 * Body: { businessId: "joes-pizza-gta" }
 */
export async function POST(request: Request) {
  try {
    const body: CreateStoreRequest = await request.json();
    const businessId = body.businessId || 'joes-pizza-gta';

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const token = createDoorDashJWT();

    const payload = {
      external_store_id: body.storeExternalId || 'joes-main-mississauga',
      name: body.storeName || "Joe's Main - Credit Valley",
      phone_number: body.phone || '+16479206806', // Joe's Pizza actual phone
      address:
        body.address ||
        '2180 Credit Valley Rd Unit 103, Mississauga, ON L5M 3C9, Canada',
      // Note: radius is NOT direct field; inferred from address/service area
    };

    const response = await fetch(
      `https://openapi.doordash.com/drive/v1/businesses/${businessId}/stores`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('DoorDash Store creation error:', {
        status: response.status,
        error: data,
      });
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ Store created:', {
      id: data.id,
      external_id: data.external_store_id,
      name: data.name,
      phone: data.phone_number,
      address: data.address,
    });

    return NextResponse.json({
      success: true,
      storeId: data.id || data.external_store_id,
      data,
    });
  } catch (error) {
    console.error('Create store error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create store',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
