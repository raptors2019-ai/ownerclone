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

// Helper function to format phone number to E.164 format
function formatPhoneToE164(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If it's a 10-digit US/Canada number, add +1 prefix
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If it already has country code (11+ digits), format as +[country][rest]
  if (cleaned.length >= 11) {
    return `+${cleaned}`;
  }

  // Fallback - return as is (should have been caught by validation)
  return phone;
}

export async function POST(request: Request) {
  try {
    const body: CreateDeliveryRequest = await request.json();

    console.log('📦 Create delivery request:', {
      externalDeliveryId: body.externalDeliveryId,
      pickupAddress: body.pickupAddress,
      pickupPhone: body.pickupPhoneNumber,
      deliveryAddress: body.deliveryAddress,
      deliveryPhone: body.deliveryPhoneNumber,
    });

    // Validate required fields
    if (!body.pickupAddress || !body.pickupPhoneNumber || !body.deliveryAddress || !body.deliveryPhoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: pickupAddress, pickupPhoneNumber, deliveryAddress, deliveryPhoneNumber' },
        { status: 400 }
      );
    }

    // Format phone numbers to E.164
    const pickupPhoneE164 = formatPhoneToE164(body.pickupPhoneNumber);
    const deliveryPhoneE164 = formatPhoneToE164(body.deliveryPhoneNumber);

    console.log('📱 Formatted phone numbers:', {
      pickupOriginal: body.pickupPhoneNumber,
      pickupFormatted: pickupPhoneE164,
      deliveryOriginal: body.deliveryPhoneNumber,
      deliveryFormatted: deliveryPhoneE164,
    });

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

    console.log('🚀 Calling DoorDash createDelivery with:', {
      external_delivery_id: body.externalDeliveryId || `order_${Date.now()}`,
      pickup_address: body.pickupAddress,
      pickup_phone_number: pickupPhoneE164,
      dropoff_address: body.deliveryAddress,
      dropoff_phone_number: deliveryPhoneE164,
    });

    // Create delivery using SDK
    const response = await client.createDelivery({
      external_delivery_id: body.externalDeliveryId || `order_${Date.now()}`,
      pickup_address: body.pickupAddress,
      pickup_phone_number: pickupPhoneE164,
      pickup_business_name: body.pickupBusinessName || "Joe's Pizza GTA",
      dropoff_address: body.deliveryAddress,
      dropoff_phone_number: deliveryPhoneE164,
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
    console.error('❌ DoorDash delivery creation error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      errorKeys: Object.keys(error),
      fullError: JSON.stringify(error, null, 2),
    });

    // Handle specific DoorDash errors
    if (error.status === 422 || error.message === 'Validation Failed') {
      return NextResponse.json(
        {
          error: 'Delivery parameters invalid',
          details: error.message,
          message: error.message,
          code: error.code,
          status: 422,
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
