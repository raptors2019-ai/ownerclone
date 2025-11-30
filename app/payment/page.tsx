import { Suspense } from 'react';
import PaymentPageWrapper from './PaymentPageWrapper';

export const metadata = {
  title: 'Complete Payment - Joe\'s Pizza GTA',
  description: 'Securely complete your pizza order payment',
};

function PaymentLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Loading Payment...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentPageWrapper />
    </Suspense>
  );
}
