'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/CartContext';
import AddressInput from '@/app/components/AddressInput';
import { Trash2, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'joe_pizza_customer_info';

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

export default function CheckoutClient() {
  const { items, removeItem, total, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load saved customer info on component mount
  useEffect(() => {
    const savedInfo = localStorage.getItem(STORAGE_KEY);
    if (savedInfo) {
      try {
        const parsed: CustomerInfo = JSON.parse(savedInfo);
        setCustomerName(parsed.name || '');
        setCustomerPhone(parsed.phone || '');
        setCustomerAddress(parsed.address || '');
      } catch (error) {
        console.error('Error loading saved customer info:', error);
      }
    }
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !customerAddress) {
      alert('Please fill in all fields');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Save customer info to localStorage for next time
      const customerInfo: CustomerInfo = {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerInfo));

      // TODO: Call API to create order and process payment
      console.log('Checkout data:', {
        customerName,
        customerPhone,
        customerAddress,
        items,
        total,
      });

      alert('Coming soon: Stripe integration for payment processing');
      setIsProcessing(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout');
      setIsProcessing(false);
    }
  };

  // Clear saved customer info
  const clearSavedInfo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    alert('Saved information cleared');
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-lg text-gray-600 mb-6">Your cart is empty</p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
        >
          <ArrowLeft size={20} />
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Order Summary */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  {item.image_url && (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-orange-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove from cart"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-orange-500">
          <h2 className="text-3xl font-bold text-orange-700 mb-8">📋 Delivery Information</h2>
          <p className="text-gray-600 mb-8">Please provide your details below</p>

          <form onSubmit={handleCheckout} className="space-y-8">
            {/* Full Name */}
            <div>
              <label className="block text-lg font-bold text-orange-700 mb-2">
                👤 Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-5 py-4 text-lg text-gray-900 bg-amber-50 border-3 border-orange-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition font-medium placeholder-gray-500"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-lg font-bold text-orange-700 mb-2">
                📞 Phone Number *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-5 py-4 text-lg text-gray-900 bg-amber-50 border-3 border-orange-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition font-medium placeholder-gray-500"
                placeholder="(123) 456-7890"
                required
              />
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-lg font-bold text-orange-700 mb-2">
                📍 Delivery Address *
              </label>
              <div className="bg-amber-50 border-3 border-orange-300 rounded-xl p-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500 transition">
                <AddressInput
                  value={customerAddress}
                  onChange={setCustomerAddress}
                  placeholder="123 Main St, Apt 4B, Mississauga, ON L5A 1A1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              {isProcessing ? '⏳ Processing...' : '💳 Proceed to Payment'}
            </button>

            <button
              type="button"
              onClick={clearSavedInfo}
              className="w-full mt-3 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-6 rounded-xl font-semibold text-sm transition"
            >
              🗑️ Clear Saved Information
            </button>
          </form>
        </div>
      </div>

      {/* Cart Total Sidebar */}
      <div>
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Total</h2>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${(total * 0.13).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>Total</span>
              <span className="text-orange-600">
                ${(total * 1.13).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              clearCart();
              alert('Cart cleared');
            }}
            className="w-full text-center text-red-500 hover:text-red-700 text-sm py-2"
          >
            Clear Cart
          </button>

          <Link
            href="/menu"
            className="block text-center text-orange-600 hover:text-orange-700 text-sm py-2 border-t border-gray-200 mt-4 pt-4"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
