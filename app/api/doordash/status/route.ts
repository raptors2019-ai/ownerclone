import { NextResponse } from 'next/server';

// Using the official @doordash/sdk
// @ts-ignore - SDK doesn't have TypeScript types
const DoorDashClient = require('@doordash/sdk');

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

    // Initialize DoorDash client with credentials
    const tokenContext = {
      key_id: process.env.DOORDASH_KEY_ID,
      developer_id: process.env.NEXT_PUBLIC_DOORDASH_DEVELOPER_ID,
      signing_secret: process.env.DOORDASH_SIGNING_SECRET,
    };

    if (!tokenContext.key_id || !tokenContext.developer_id || !tokenContext.signing_secret) {
      console.error('Missing DoorDash credentials');
      return NextResponse.json(
        { error: 'DoorDash credentials not configured' },
        { status: 500 }
      );
    }

    const client = new DoorDashClient.DoorDashClient(tokenContext);

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
