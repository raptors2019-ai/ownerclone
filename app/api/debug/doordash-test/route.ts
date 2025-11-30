import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { pickupAddress, deliveryAddress, customerPhone } = await request.json();

    const DOORDASH_API_BASE = 'https://openapi.doordash.com/drive/v2';
    const keyId = process.env.DOORDASH_KEY_ID;
    const signingSecret = process.env.DOORDASH_SIGNING_SECRET;
    const developerId = process.env.NEXT_PUBLIC_DOORDASH_DEVELOPER_ID;

    if (!keyId || !signingSecret || !developerId) {
      return NextResponse.json(
        { error: 'DoorDash credentials not configured' },
        { status: 500 }
      );
    }

    const quotePayload = {
      external_delivery_id: `order_${Date.now()}`,
      pickup_address: pickupAddress,
      dropoff_address: deliveryAddress,
      dropoff_phone_number: customerPhone,
      pickup_time: Math.floor(Date.now() / 1000),
    };

    const payloadString = JSON.stringify(quotePayload);

    // Create JWT token
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      aud: 'doordash',
      iss: developerId,
      kid: keyId,
      exp: now + 300,
      iat: now,
    };

    const token = jwt.sign(
      jwtPayload,
      Buffer.from(signingSecret, 'base64'),
      {
        algorithm: 'HS256',
        header: {
          'dd-ver': 'DD-JWT-V1',
        } as any,
      }
    );

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US',
    };

    console.log('DoorDash Request Details:', {
      url: `${DOORDASH_API_BASE}/deliveries`,
      method: 'POST',
      headers,
      payload: quotePayload,
    });

    const response = await fetch(`${DOORDASH_API_BASE}/deliveries`, {
      method: 'POST',
      headers,
      body: payloadString,
    });

    const data = await response.json();

    console.log('DoorDash Response:', {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    if (data.field_errors) {
      console.log('Field Errors Details:', JSON.stringify(data.field_errors, null, 2));
    }

    return NextResponse.json({
      request: {
        url: `${DOORDASH_API_BASE}/deliveries`,
        headers: {
          ...headers,
          Authorization: headers.Authorization.substring(0, 20) + '...',
        },
        payload: quotePayload,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        body: data,
      },
    });
  } catch (error) {
    console.error('DoorDash test error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
