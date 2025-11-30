'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentPageClient from '@/app/checkout/PaymentPageClient';
import { useSearchParams, useRouter } from 'next/navigation';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPageWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get parameters from URL
  const secret = searchParams.get('secret');
  const paymentIntentId = searchParams.get('paymentIntentId');
  const customerName = searchParams.get('customerName');
  const customerPhone = searchParams.get('customerPhone');
  const customerAddress = searchParams.get('customerAddress');
  const deliveryMethod = searchParams.get('deliveryMethod');
  const deliveryFee = searchParams.get('deliveryFee');
  const estimatedDeliveryTime = searchParams.get('estimatedDeliveryTime');

  // Validate required parameters
  if (!secret || !paymentIntentId || !customerName || !customerPhone || !deliveryMethod) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Payment Link</h1>
          <p className="text-gray-600 mb-6">
            The payment link appears to be invalid or expired. Please try again from checkout.
          </p>
          <button
            onClick={() => router.push('/checkout')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  const deliveryFeeNum = deliveryFee ? parseFloat(deliveryFee) : 0;
  const deliveryMethodTyped = deliveryMethod as 'pickup' | 'delivery';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-orange-600 mb-8">
          💳 Secure Payment
        </h1>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: secret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#f97316', // orange-500
                colorText: '#1f2937',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
              },
            },
          }}
        >
          <PaymentPageClient
            clientSecret={secret}
            paymentIntentId={paymentIntentId}
            customerName={decodeURIComponent(customerName)}
            customerPhone={decodeURIComponent(customerPhone)}
            customerAddress={customerAddress ? decodeURIComponent(customerAddress) : ''}
            deliveryMethod={deliveryMethodTyped}
            deliveryFee={deliveryFeeNum}
            estimatedDeliveryTime={estimatedDeliveryTime ? decodeURIComponent(estimatedDeliveryTime) : ''}
          />
        </Elements>
      </div>
    </div>
  );
}
