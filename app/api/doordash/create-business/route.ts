import { NextResponse } from 'next/server';
import { createDoorDashJWT } from '@/lib/doordash-jwt';

/**
 * POST /api/doordash/create-business
 * Creates a DoorDash Business for Store/Delivery management
 * No request body needed - creates default business for Joe's Pizza GTA
 */
export async function POST() {
  try {
    const token = createDoorDashJWT();

    const payload = {
      external_business_id: 'joes-pizza-gta',
      name: "Joe's Pizza GTA",
      description: 'MVP Sandbox Store - Mississauga',
    };

    const response = await fetch('https://openapi.doordash.com/drive/v1/businesses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DoorDash Business creation error:', {
        status: response.status,
        error: data,
      });
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ Business created:', {
      id: data.id,
      external_id: data.external_business_id,
      name: data.name,
    });

    return NextResponse.json({
      success: true,
      businessId: data.id || data.external_business_id,
      data,
    });
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create business',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
