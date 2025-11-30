import { Metadata } from 'next';
import { getMenu } from '@/lib/supabase';
import MenuClient from './menu/MenuClient';

export const metadata: Metadata = {
  title: "Joe's Pizza GTA - Order Now",
  description: 'Fresh, delicious pizza delivered fast in Mississauga. Browse our menu and order online.',
  openGraph: {
    title: "Joe's Pizza GTA",
    description: 'Fresh, delicious pizza delivered fast',
    type: 'website',
  },
};

export default async function Home() {
  const categories = await getMenu(1);
  const allMenuItems = categories.flatMap((cat) => cat.menu_items || []);

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-5xl font-bold text-orange-700 mb-2">🍕 Joe's Pizza GTA</h1>
        <p className="text-gray-600 mb-8 text-lg">Fresh ingredients, made to order. Order now for delivery!</p>

        <MenuClient categories={categories} menuItems={allMenuItems} />
      </div>
    </div>
  );
}
