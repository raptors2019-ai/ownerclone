import { Metadata } from 'next';
import { getMenu } from '@/lib/supabase';
import MenuClient from './MenuClient';

export const metadata: Metadata = {
  title: "Menu - Joe's Pizza GTA",
  description: 'Browse our delicious pizza menu. Fresh ingredients, fast delivery in Mississauga.',
  openGraph: {
    title: "Menu - Joe's Pizza GTA",
    description: 'Browse our delicious pizza menu',
    type: 'website',
  },
};

export default async function MenuPage() {
  // Joe's Pizza GTA has restaurant_id = 1
  const categories = await getMenu(1);

  // Flatten menu items from all categories
  const allMenuItems = categories.flatMap((cat) => cat.menu_items || []);

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-orange-700 mb-2">Our Menu</h1>
        <p className="text-gray-600 mb-8">Fresh ingredients, made to order</p>

        <MenuClient categories={categories} menuItems={allMenuItems} />
      </div>
    </div>
  );
}
