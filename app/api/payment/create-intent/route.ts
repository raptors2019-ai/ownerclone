import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface PaymentRequest {
  subtotal: number; // in dollars
  deliveryFee: number; // in dollars
  taxAmount: number; // in dollars
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
}

export async function POST(request: Request) {
  try {
    const body: PaymentRequest = await request.json();

    // Validate required fields
    if (body.subtotal <= 0 || !body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: subtotal, customerName, customerPhone' },
        { status: 400 }
      );
    }

    // Calculate total in cents (Stripe works with cents)
    const totalCents = Math.round((body.subtotal + body.deliveryFee + body.taxAmount) * 100);

    if (totalCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Build description
    const description = `Joe's Pizza Order - ${body.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}`;

    // Build metadata for order tracking
    const metadata = {
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryMethod: body.deliveryMethod,
      deliveryAddress: body.deliveryAddress || 'N/A',
      subtotal: body.subtotal.toFixed(2),
      deliveryFee: body.deliveryFee.toFixed(2),
      taxAmount: body.taxAmount.toFixed(2),
    };

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      description,
      metadata,
      receipt_email: body.customerEmail,
      statement_descriptor_suffix: 'JOES PIZZA',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ PaymentIntent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      customer: body.customerName,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalCents,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
