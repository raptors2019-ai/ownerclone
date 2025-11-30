import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface DeliveryQuoteRequest {
  pickupAddress: string;
  deliveryAddress: string;
  customerPhone: string;
  pickupTime?: number; // Unix timestamp, optional (defaults to ASAP)
}

// DoorDash API constants
const DOORDASH_API_BASE = 'https://openapi.doordash.com/drive/v2';

// Helper function to create DoorDash JWT token
function createDoorDashJWT(): string {
  const developerId = process.env.NEXT_PUBLIC_DOORDASH_DEVELOPER_ID;
  const keyId = process.env.DOORDASH_KEY_ID;
  const signingSecret = process.env.DOORDASH_SIGNING_SECRET;

  if (!developerId || !keyId || !signingSecret) {
    throw new Error('DoorDash credentials not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: now + 300, // Token expires in 5 minutes
    iat: now,
  };

  const token = jwt.sign(
    payload,
    Buffer.from(signingSecret, 'base64'),
    {
      algorithm: 'HS256',
      header: {
        'dd-ver': 'DD-JWT-V1',
      } as any,
    }
  );

  return token;
}

export async function POST(request: Request) {
  try {
    const body: DeliveryQuoteRequest = await request.json();

    if (!body.pickupAddress || !body.deliveryAddress || !body.customerPhone) {
      return NextResponse.json(
        { error: 'Missing pickup address, delivery address, or customer phone' },
        { status: 400 }
      );
    }

    // Format phone number: remove all non-digit characters
    const cleanPhone = body.customerPhone.replace(/\D/g, '');
    // Ensure it's in +1XXXXXXXXXX format for North America
    const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : (cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`);

    // Format pickup time as ISO 8601 datetime (DoorDash expects specific format)
    const pickupDate = body.pickupTime ? new Date(body.pickupTime * 1000) : new Date(Date.now() + 30 * 60000); // Default to 30 mins from now
    // Format: YYYY-MM-DDThh:mm:ss.ffffffZ
    const year = pickupDate.getUTCFullYear();
    const month = String(pickupDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(pickupDate.getUTCDate()).padStart(2, '0');
    const hours = String(pickupDate.getUTCHours()).padStart(2, '0');
    const minutes = String(pickupDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(pickupDate.getUTCSeconds()).padStart(2, '0');
    const pickupTimeISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;

    // Create delivery quote request
    const quotePayload = {
      external_delivery_id: `order_${Date.now()}`,
      pickup_address: body.pickupAddress,
      dropoff_address: body.deliveryAddress,
      dropoff_phone_number: formattedPhone,
      pickup_time: pickupTimeISO,
    };

    const payloadString = JSON.stringify(quotePayload);
    const token = createDoorDashJWT();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Call DoorDash API
    let response;
    let data;

    try {
      response = await fetch(`${DOORDASH_API_BASE}/deliveries`, {
        method: 'POST',
        headers: {
          ...headers,
          'Accept-Language': 'en-US',
        },
        body: payloadString,
      });

      data = await response.json();

      if (!response.ok) {
        console.error('DoorDash API error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          requestPayload: quotePayload,
        });
        if (data.field_errors) {
          console.error('Field errors:', JSON.stringify(data.field_errors, null, 2));
        }
        // Fallback to default fee on API error
        console.warn('DoorDash API unavailable, using default fee');
        return NextResponse.json({
          success: true,
          deliveryId: `fallback_${Date.now()}`,
          fee: 5.99,
          estimatedPickupTime: Math.floor(Date.now() / 1000) + 1800, // 30 min
          estimatedDeliveryTime: Math.floor(Date.now() / 1000) + 3600, // 60 min
          status: 'fallback',
          message: 'Using default fee - DoorDash API temporarily unavailable',
        });
      }
    } catch (fetchError) {
      console.error('DoorDash fetch error:', fetchError);
      // Fallback to default fee if fetch fails
      console.warn('DoorDash API fetch failed, using default fee');
      return NextResponse.json({
        success: true,
        deliveryId: `fallback_${Date.now()}`,
        fee: 5.99,
        estimatedPickupTime: Math.floor(Date.now() / 1000) + 1800,
        estimatedDeliveryTime: Math.floor(Date.now() / 1000) + 3600,
        status: 'fallback',
        message: 'Using default fee - DoorDash API currently unavailable',
      });
    }

    return NextResponse.json({
      success: true,
      deliveryId: data.id,
      fee: data.fee_in_cents ? data.fee_in_cents / 100 : 5.99,
      estimatedPickupTime: data.pickup_time,
      estimatedDeliveryTime: data.delivery_time,
      status: data.status,
    });
  } catch (error) {
    console.error('DoorDash delivery quote error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process delivery quote',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
