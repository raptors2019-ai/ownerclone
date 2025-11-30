'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import StripePaymentForm from '@/app/components/StripePaymentForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PaymentPageProps {
  clientSecret: string;
  paymentIntentId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryFee: number;
  estimatedDeliveryTime: string;
}

export default function PaymentPageClient({
  clientSecret,
  paymentIntentId,
  customerName,
  customerPhone,
  customerAddress,
  deliveryMethod,
  deliveryFee,
  estimatedDeliveryTime,
}: PaymentPageProps) {
  const { items, total, clearCart } = useCart();
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string>('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const taxAmount = (total + deliveryFee) * 0.13;
  const finalTotal = total + deliveryFee + taxAmount;

  const handlePaymentSuccess = async (stripePaymentIntentId: string) => {
    console.log('Payment successful:', stripePaymentIntentId);

    // If delivery, create DoorDash delivery after successful payment
    if (deliveryMethod === 'delivery') {
      setIsCreatingDelivery(true);
      setDeliveryError('');

      try {
        const createDeliveryResponse = await fetch('/api/doordash/create-delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupAddress: '1000 4th Ave, Seattle, WA, 98104',
            pickupPhoneNumber: '+1-206-256-8477', // Restaurant phone number (test)
            deliveryAddress: customerAddress,
            deliveryPhoneNumber: customerPhone,
            pickupBusinessName: "Joe's Pizza GTA",
            deliveryBusinessName: customerName,
            externalDeliveryId: `order_${stripePaymentIntentId}`,
            orderValue: Math.round(total * 100), // in cents
          }),
        });

        const deliveryData = await createDeliveryResponse.json();

        if (!createDeliveryResponse.ok) {
          console.warn('DoorDash delivery creation failed, but payment succeeded:', deliveryData);
          // Payment succeeded even if delivery creation failed - this is acceptable
          // User can still see their order confirmation
        } else {
          console.log('✅ DoorDash delivery created:', deliveryData);
        }
      } catch (error) {
        console.error('Error creating delivery:', error);
        // Don't fail the order if delivery creation fails
        // Payment was successful
      } finally {
        setIsCreatingDelivery(false);
      }
    }

    // Clear cart and show confirmation
    clearCart();
    setOrderConfirmed(true);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setDeliveryError(error);
  };

  // If order is confirmed, show success screen
  if (orderConfirmed) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-6">
            {deliveryMethod === 'delivery'
              ? `Your order will be delivered to ${customerAddress}`
              : 'Your order is ready for pickup at Joe\'s Pizza'}
          </p>

          {estimatedDeliveryTime && deliveryMethod === 'delivery' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Estimated Delivery Time</p>
              <p className="text-2xl font-bold text-green-600">{estimatedDeliveryTime}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {deliveryMethod === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (13%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
          >
            <ArrowLeft size={20} />
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h2>
            <p className="text-gray-600 mb-6">Secure payment powered by Stripe</p>

            <StripePaymentForm
              amount={finalTotal}
              clientSecret={clientSecret}
              isLoading={isCreatingDelivery}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>

          {isCreatingDelivery && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">⏳ Setting up your delivery with DoorDash...</p>
            </div>
          )}

          {deliveryError && !isCreatingDelivery && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800">⚠️ {deliveryError}</p>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

            {/* Customer Info */}
            <div className="border-b pb-4 mb-4">
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-semibold text-gray-900">{customerName}</p>
              <p className="text-sm text-gray-600">{customerPhone}</p>
            </div>

            {/* Delivery Method */}
            <div className="border-b pb-4 mb-4">
              <p className="text-sm text-gray-600">Method</p>
              <p className="font-semibold text-gray-900">
                {deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
              </p>
              {deliveryMethod === 'delivery' && (
                <p className="text-sm text-gray-600 mt-2">{customerAddress}</p>
              )}
              {estimatedDeliveryTime && deliveryMethod === 'delivery' && (
                <p className="text-sm text-green-600 mt-2">⏱️ {estimatedDeliveryTime}</p>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Tax (13%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-orange-600">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
