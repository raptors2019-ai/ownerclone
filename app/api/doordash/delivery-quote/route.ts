import { NextResponse } from 'next/server';
import { createDoorDashJWT } from '@/lib/doordash-jwt';

interface DeliveryQuoteRequest {
  pickupAddress?: string; // Optional if using store ID
  deliveryAddress: string;
  customerPhone: string;
  pickupTime?: number; // Unix timestamp, optional (defaults to ASAP)
  businessId?: string; // DoorDash Business ID (defaults: 'joes-pizza-gta')
  storeId?: string; // DoorDash Store ID (defaults: 'joes-main-mississauga') - FIXES phone/distance issues!
}

// DoorDash API constants
const DOORDASH_API_BASE = 'https://openapi.doordash.com/drive/v2';

export async function POST(request: Request) {
  try {
    const body: DeliveryQuoteRequest = await request.json();

    // Validate required fields
    if (!body.deliveryAddress || !body.customerPhone) {
      return NextResponse.json(
        { error: 'Missing delivery address or customer phone' },
        { status: 400 }
      );
    }

    // pickupAddress is optional - we default to using the "default" store
    // which pulls address/phone from DoorDash account configuration

    // Format phone numbers: remove all non-digit characters and format as (XXX) XXX-XXXX
    const cleanPhone = body.customerPhone.replace(/\D/g, '');
    const formattedCustomerPhone = `+1${cleanPhone.slice(-10)}`;

    // Format restaurant phone (default to restaurant's actual number if not provided)
    const restaurantPhoneRaw = body.restaurantPhone || '6479206806'; // Joe's Pizza GTA
    const cleanRestaurantPhone = restaurantPhoneRaw.replace(/\D/g, '');
    const formattedRestaurantPhone = `+1${cleanRestaurantPhone.slice(-10)}`;

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
    // KEY FIX: Use default business/store to avoid phone/distance validation errors
    // Default store pulls config from DoorDash account
    const businessId = body.businessId || 'default'; // Every account has this
    const storeId = body.storeId || 'default'; // Every account has this

    // Always use store IDs (defaults are always available)
    const useStoreIds = true;

    const quotePayload: any = {
      external_delivery_id: `order_${Date.now()}`,
      dropoff_address: body.deliveryAddress,
      dropoff_phone_number: formattedCustomerPhone,
      dropoff_business_name: 'Customer',
      dropoff_contact_send_notifications: true,
      pickup_time_estimated: pickupTimeISO,
      order_value: 2000, // $20 default order value in cents
    };

    if (useStoreIds) {
      // RECOMMENDED: Use store IDs (pulls phone/address from store config)
      quotePayload.pickup_external_business_id = businessId;
      quotePayload.pickup_external_store_id = storeId;
      // NOTE: When using store ID, omit pickup_address/phone_number - they come from store!
    } else {
      // FALLBACK: Direct address/phone (but prone to validation errors)
      quotePayload.pickup_address = body.pickupAddress || '2180 Credit Valley Rd Unit 103, Mississauga, ON L5M 3C9';
      quotePayload.pickup_business_name = "Joe's Pizza GTA";
      quotePayload.pickup_phone_number = formattedRestaurantPhone;
    }

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
