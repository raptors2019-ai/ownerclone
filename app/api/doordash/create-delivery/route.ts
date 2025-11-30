import { NextResponse } from 'next/server';

// Using the official @doordash/sdk
// @ts-ignore - SDK doesn't have TypeScript types
const DoorDashClient = require('@doordash/sdk');

interface CreateDeliveryRequest {
  pickupAddress: string;
  pickupPhoneNumber: string;
  deliveryAddress: string;
  deliveryPhoneNumber: string;
  pickupBusinessName?: string;
  deliveryBusinessName?: string;
  externalDeliveryId?: string;
  orderValue?: number; // in cents
}

export async function POST(request: Request) {
  try {
    const body: CreateDeliveryRequest = await request.json();

    // Validate required fields
    if (!body.pickupAddress || !body.pickupPhoneNumber || !body.deliveryAddress || !body.deliveryPhoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: pickupAddress, pickupPhoneNumber, deliveryAddress, deliveryPhoneNumber' },
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
      return NextResponse.json(
        { error: 'DoorDash credentials not configured' },
        { status: 500 }
      );
    }

    const client = new DoorDashClient.DoorDashClient(tokenContext);

    // Create delivery using SDK
    const response = await client.createDelivery({
      external_delivery_id: body.externalDeliveryId || `order_${Date.now()}`,
      pickup_address: body.pickupAddress,
      pickup_phone_number: body.pickupPhoneNumber,
      pickup_business_name: body.pickupBusinessName || "Joe's Pizza GTA",
      dropoff_address: body.deliveryAddress,
      dropoff_phone_number: body.deliveryPhoneNumber,
      dropoff_business_name: body.deliveryBusinessName || 'Customer',
      order_value: body.orderValue || 0,
      dropoff_contact_send_notifications: true,
    });

    console.log('✅ Delivery created successfully:', {
      deliveryId: response.data.external_delivery_id,
      fee: response.data.fee,
      status: response.data.delivery_status,
      pickupTime: response.data.pickup_time_estimated,
      dropoffTime: response.data.dropoff_time_estimated,
    });

    return NextResponse.json({
      success: true,
      deliveryId: response.data.external_delivery_id,
      fee: response.data.fee ? response.data.fee / 100 : 0, // Convert cents to dollars
      feeInCents: response.data.fee,
      status: response.data.delivery_status,
      pickupTimeEstimated: response.data.pickup_time_estimated,
      dropoffTimeEstimated: response.data.dropoff_time_estimated,
      trackingUrl: response.data.tracking_url,
      supportReference: response.data.support_reference,
      data: response.data,
    });
  } catch (error: any) {
    console.error('DoorDash delivery creation error:', {
      error: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    });

    // Handle specific DoorDash errors
    if (error.status === 422) {
      return NextResponse.json(
        {
          error: 'Delivery parameters invalid',
          details: error.message,
          message: error.message,
          code: error.code,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create delivery',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
