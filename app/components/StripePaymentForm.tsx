'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number; // in dollars
  clientSecret: string;
  isLoading: boolean;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function StripePaymentForm({
  amount,
  clientSecret,
  isLoading,
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe is not loaded yet. Please try again.');
      setPaymentStatus('error');
      onPaymentError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed
        console.error('Payment error:', error);
        const errorMsg = error.message || error.code || 'Payment failed. Please try again.';
        setErrorMessage(errorMsg);
        setPaymentStatus('error');
        onPaymentError(errorMsg);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        console.log('✅ Payment succeeded:', paymentIntent.id);
        setPaymentStatus('success');
        onPaymentSuccess(paymentIntent.id);
      } else {
        // Payment is processing or needs further action
        console.log('Payment status:', paymentIntent?.status);
        // For test cards, succeeded status should be reached
        if (paymentIntent?.status === 'requires_action') {
          setErrorMessage('Additional authentication required. Please check your bank app.');
          setPaymentStatus('error');
          onPaymentError('Authentication required');
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      const errorMsg = err.message || 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      setPaymentStatus('error');
      onPaymentError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: '',
                email: '',
              },
            },
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-800">Payment Error</h3>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-green-800">Payment Successful</h3>
            <p className="text-sm text-green-700 mt-1">Your order has been confirmed.</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing || isLoading || paymentStatus === 'success'}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition ${
          paymentStatus === 'success'
            ? 'bg-green-500 text-white cursor-not-allowed'
            : isProcessing || isLoading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
        }`}
      >
        {paymentStatus === 'success'
          ? '✅ Payment Complete'
          : isProcessing
          ? '⏳ Processing Payment...'
          : isLoading
          ? '⏳ Loading...'
          : `💳 Pay $${amount.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted.
      </p>
    </form>
  );
}
