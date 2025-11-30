import { Metadata } from 'next';
import { getMenu } from '@/lib/supabase';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: "Checkout - Joe's Pizza GTA",
  description: 'Complete your order',
};

export default async function CheckoutPage() {
  // Joe's Pizza GTA has restaurant_id = 1
  const categories = await getMenu(1);

  // Flatten menu items from all categories
  const allMenuItems = categories.flatMap((cat) => cat.menu_items || []);

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-orange-700 mb-8">Checkout</h1>
        <CheckoutClient menuItems={allMenuItems} />
      </div>
    </div>
  );
}
