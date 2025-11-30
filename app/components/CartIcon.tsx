'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/CartContext';

export default function CartIcon() {
  const { items } = useCart();
  const itemCount = items.length;

  return (
    <Link
      href="/checkout"
      className="relative text-white hover:text-amber-100 transition"
      title="View cart"
    >
      <ShoppingCart size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
