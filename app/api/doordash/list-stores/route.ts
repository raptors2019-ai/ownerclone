import { NextResponse } from 'next/server';
import { createDoorDashJWT } from '@/lib/doordash-jwt';

/**
 * GET /api/doordash/list-stores?businessId=joes-pizza-gta
 * Lists all stores for a business - verify store creation
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId') || 'joes-pizza-gta';

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query param is required' },
        { status: 400 }
      );
    }

    const token = createDoorDashJWT();

    const response = await fetch(
      `https://openapi.doordash.com/drive/v1/businesses/${businessId}/stores`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('DoorDash List Stores error:', {
        status: response.status,
        error: data,
      });
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ Stores listed:', {
      count: data.results?.length || 0,
      stores: data.results?.map((s: any) => ({
        id: s.id,
        name: s.name,
        phone: s.phone_number,
        address: s.address,
      })),
    });

    return NextResponse.json({
      success: true,
      stores: data.results || [],
      data,
    });
  } catch (error) {
    console.error('List stores error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list stores',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
