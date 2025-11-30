'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Category, MenuItem } from '@/lib/supabase';
import { useCart } from '@/lib/CartContext';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

interface MenuClientProps {
  categories: Category[];
  menuItems: MenuItem[];
}

export default function MenuClient({ categories, menuItems }: MenuClientProps) {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<number>(categories[0]?.id || 0);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [addedFeedback, setAddedFeedback] = useState<number | null>(null);

  const filteredItems = menuItems.filter((item) => item.category_id === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    const quantity = quantities[item.id] || 1;
    addItem(item, quantity);
    setQuantities({ ...quantities, [item.id]: 0 });
    setAddedFeedback(item.id);
    setTimeout(() => setAddedFeedback(null), 2000);
  };

  const handleQuantityChange = (itemId: number, delta: number) => {
    const current = quantities[itemId] || 1;
    const newQuantity = Math.max(1, current + delta);
    setQuantities({ ...quantities, [itemId]: newQuantity });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Categories Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 bg-white rounded-lg shadow-md p-4">
          <h2 className="font-bold text-lg text-orange-700 mb-4">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setQuantities({});
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'text-gray-700 hover:bg-amber-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {/* Item Image */}
              <div className="relative h-48 w-full bg-gray-200">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-amber-200">
                    <span className="text-4xl">🍕</span>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}

                {/* Price */}
                <div className="mt-4 text-2xl font-bold text-orange-600">
                  ${item.price.toFixed(2)}
                </div>

                {/* Quantity Selector & Add to Cart */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    disabled={(quantities[item.id] || 1) <= 1}
                    className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="flex-1 text-center font-semibold">
                    {quantities[item.id] || 1}
                  </span>

                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      addedFeedback === item.id
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    {addedFeedback === item.id ? 'Added!' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items in this category yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
