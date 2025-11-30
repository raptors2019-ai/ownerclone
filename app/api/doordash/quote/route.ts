import { NextResponse } from 'next/server';
import { calculateDistance, calculateDeliveryFee } from '@/lib/distance-utils';

interface DeliveryQuoteRequest {
  pickupAddress: string;
  deliveryAddress: string;
  customerPhone: string;
}

// Constants
const MAX_DELIVERY_DISTANCE_KM = 100;
const RESTAURANT_ADDRESS = '1000 4th Ave, Seattle, WA, 98104'; // US test address

export async function POST(request: Request) {
  try {
    const body: DeliveryQuoteRequest = await request.json();

    // Validate required fields
    if (!body.pickupAddress || !body.deliveryAddress || !body.customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: pickupAddress, deliveryAddress, customerPhone' },
        { status: 400 }
      );
    }

    // Calculate distance between pickup and delivery addresses
    const distanceResult = await calculateDistance(body.pickupAddress, body.deliveryAddress);

    if (!distanceResult) {
      // Fallback if distance calculation fails
      console.warn('Distance calculation failed, using fallback');
      return NextResponse.json({
        success: true,
        available: false,
        message: 'Unable to calculate delivery distance. Please try again.',
        deliveryId: null,
        fee: null,
      });
    }

    const { distanceKm, durationMinutes } = distanceResult;

    console.log('Delivery Quote Requested:', {
      pickup: body.pickupAddress,
      delivery: body.deliveryAddress,
      distanceKm,
      durationMinutes,
      maxAllowed: MAX_DELIVERY_DISTANCE_KM,
    });

    // Check if delivery distance exceeds maximum
    if (distanceKm > MAX_DELIVERY_DISTANCE_KM) {
      console.warn(`Delivery distance (${distanceKm}km) exceeds maximum (${MAX_DELIVERY_DISTANCE_KM}km)`);
      return NextResponse.json({
        success: true,
        available: false,
        message: `Delivery not available - distance exceeds our service area (${distanceKm.toFixed(1)}km requested, max ${MAX_DELIVERY_DISTANCE_KM}km)`,
        distanceKm,
        maxDistance: MAX_DELIVERY_DISTANCE_KM,
        deliveryId: null,
        fee: null,
      });
    }

    // Calculate fee based on distance
    const feeAmount = calculateDeliveryFee(distanceKm);

    console.log('✅ Delivery quote available:', {
      distanceKm,
      durationMinutes,
      feeAmount,
    });

    return NextResponse.json({
      success: true,
      available: true,
      distanceKm,
      durationMinutes,
      estimatedDeliveryTime: new Date(Date.now() + durationMinutes * 60000).toLocaleTimeString(),
      fee: feeAmount,
      feeInCents: Math.round(feeAmount * 100),
      message: `Delivery available in ${durationMinutes} minutes`,
    });
  } catch (error) {
    console.error('Delivery quote error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate delivery quote',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
