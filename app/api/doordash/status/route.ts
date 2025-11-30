import { NextResponse } from 'next/server';
import { DoorDashClient } from '@doordash/sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deliveryId } = body;

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Delivery ID is required' },
        { status: 400 }
      );
    }

    // Initialize DoorDash client
    const developerId = process.env.NEXT_PUBLIC_DOORDASH_DEVELOPER_ID;
    const keyId = process.env.DOORDASH_KEY_ID;
    const signingSecret = process.env.DOORDASH_SIGNING_SECRET;

    if (!developerId || !keyId || !signingSecret) {
      console.error('Missing DoorDash credentials');
      return NextResponse.json(
        { error: 'DoorDash credentials not configured' },
        { status: 500 }
      );
    }

    const client = new DoorDashClient({
      developerId,
      keyId,
      signingSecret,
    });

    // Get delivery status
    const response = await client.getDelivery(deliveryId);

    console.log('✅ Delivery status retrieved:', {
      id: response.data.id,
      status: response.data.delivery_status,
      trackingUrl: response.data.tracking_url,
    });

    return NextResponse.json({
      success: true,
      deliveryId: response.data.id,
      status: response.data.delivery_status,
      trackingUrl: response.data.tracking_url,
      deliveryStatus: response.data.delivery_status,
      data: response.data,
    });
  } catch (error: any) {
    console.error('Error getting delivery status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get delivery status',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
