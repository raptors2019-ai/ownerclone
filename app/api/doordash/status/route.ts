import { NextResponse } from 'next/server';

// Using the official @doordash/sdk
// @ts-ignore - SDK doesn't have TypeScript types
const DoorDashClient = require('@doordash/sdk');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deliveryId } = body;

    console.log('🔍 Status endpoint called with deliveryId:', deliveryId);

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
    console.log('📍 Fetching delivery status for ID:', deliveryId);
    console.log('🔧 Client initialized:', typeof client, Object.keys(client));

    let response;
    try {
      response = await client.getDelivery(deliveryId);
      console.log('📦 Raw response received:', JSON.stringify(response, null, 2));
    } catch (sdkError: any) {
      console.error('❌ SDK error calling getDelivery:', {
        message: sdkError.message,
        code: sdkError.code,
        status: sdkError.status,
        details: sdkError.details,
        stack: sdkError.stack,
      });
      throw sdkError;
    }

    if (!response || !response.data) {
      console.error('⚠️ Invalid response structure:', response);
      return NextResponse.json(
        {
          error: 'Invalid response from DoorDash',
          receivedResponse: String(response),
        },
        { status: 500 }
      );
    }

    console.log('✅ Delivery status retrieved:', {
      id: response.data.id,
      externalId: response.data.external_delivery_id,
      status: response.data.delivery_status,
      trackingUrl: response.data.tracking_url,
    });

    return NextResponse.json({
      success: true,
      deliveryId: response.data.id || response.data.external_delivery_id,
      externalDeliveryId: response.data.external_delivery_id,
      status: response.data.delivery_status,
      trackingUrl: response.data.tracking_url,
      deliveryStatus: response.data.delivery_status,
      data: response.data,
    });
  } catch (error: any) {
    console.error('❌ Error getting delivery status:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
      fullError: String(error),
    });
    return NextResponse.json(
      {
        error: 'Failed to get delivery status',
        details: error.message || String(error),
        code: error.code,
      },
      { status: 500 }
    );
  }
}
