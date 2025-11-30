import { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: "Checkout - Joe's Pizza GTA",
  description: 'Complete your order',
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-orange-700 mb-8">Checkout</h1>
        <CheckoutClient />
      </div>
    </div>
  );
}
