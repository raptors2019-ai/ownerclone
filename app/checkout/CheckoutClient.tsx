'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/CartContext';
import { MenuItem } from '@/lib/supabase';
import AddressInput from '@/app/components/AddressInput';
import { Trash2, ArrowLeft, Plus, Minus, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

type DeliveryMethod = 'pickup' | 'delivery';

interface CheckoutClientProps {
  menuItems: MenuItem[];
}

export default function CheckoutClient({ menuItems = [] }: CheckoutClientProps) {
  const { items, removeItem, total, clearCart, addItem } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>('');
  const [isLoadingDeliveryQuote, setIsLoadingDeliveryQuote] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string>('');
  const [carouselQuantities, setCarouselQuantities] = useState<{ [key: number]: number }>({});
  const [addedFeedback, setAddedFeedback] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const ITEMS_PER_SLIDE = 3;
  const carouselItems = menuItems.length > 0 ? menuItems : [];
  const totalItems = carouselItems.length;

  const handleCarouselPrev = () => {
    setCarouselIndex((prevIndex) => {
      return (prevIndex - 1 + totalItems) % totalItems;
    });
  };

  const handleCarouselNext = () => {
    setCarouselIndex((prevIndex) => {
      return (prevIndex + 1) % totalItems;
    });
  };

  // Get carousel items with wrapping using modulo
  const getCarouselDisplayItems = () => {
    if (totalItems === 0) return [];
    const items = [];
    for (let i = 0; i < ITEMS_PER_SLIDE; i++) {
      items.push(carouselItems[(carouselIndex + i) % totalItems]);
    }
    return items;
  };

  const displayItems = getCarouselDisplayItems();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone) {
      alert('Please fill in name and phone number');
      return;
    }

    if (deliveryMethod === 'delivery' && !customerAddress) {
      alert('Please enter a delivery address');
      return;
    }

    if (deliveryMethod === 'delivery' && deliveryFee === 0 && !deliveryError) {
      alert('Please wait for delivery fee calculation or try entering your address again');
      return;
    }

    if (deliveryMethod === 'delivery' && deliveryError) {
      alert(`Cannot proceed with delivery: ${deliveryError}`);
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate tax
      const taxAmount = (total + deliveryFee) * 0.13;

      // Create Stripe payment intent
      const intentResponse = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotal: total,
          deliveryFee: deliveryFee,
          taxAmount: taxAmount,
          customerName: customerName,
          customerPhone: customerPhone,
          customerEmail: '', // Optional: could be added as a form field
          deliveryMethod: deliveryMethod,
          deliveryAddress: customerAddress,
        }),
      });

      const intentData = await intentResponse.json();

      if (!intentResponse.ok) {
        const errorMsg = intentData.details || intentData.error || 'Failed to create payment';
        console.error('Payment intent error response:', intentData);
        throw new Error(errorMsg);
      }

      console.log('✅ Payment intent created:', intentData.paymentIntentId);

      // Build query parameters for payment page
      const params = new URLSearchParams({
        secret: intentData.clientSecret,
        paymentIntentId: intentData.paymentIntentId,
        customerName: customerName,
        customerPhone: customerPhone,
        deliveryMethod: deliveryMethod,
        deliveryFee: deliveryFee.toString(),
        subtotal: total.toString(),
      });

      if (deliveryMethod === 'delivery') {
        params.append('customerAddress', customerAddress);
        params.append('estimatedDeliveryTime', estimatedDeliveryTime);
      }

      // Redirect to payment page
      window.location.href = `/payment?${params.toString()}`;
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred during checkout');
      setIsProcessing(false);
    }
  };

  // Get delivery quote from DoorDash API
  const getDeliveryQuote = async (address: string, phone: string) => {
    if (!address || !phone) {
      setDeliveryError('');
      setDeliveryFee(0);
      setEstimatedDeliveryTime('');
      return;
    }

    setIsLoadingDeliveryQuote(true);
    setDeliveryError('');

    try {
      const response = await fetch('/api/doordash/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: '1000 4th Ave, Seattle, WA, 98104', // US test address (Seattle)
          deliveryAddress: address,
          customerPhone: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeliveryError(data.error || 'Failed to get delivery quote');
        setDeliveryFee(0);
        setEstimatedDeliveryTime('');
        return;
      }

      // Check if delivery is available (within 100km)
      if (!data.available) {
        setDeliveryError(data.message || 'Delivery not available for this address');
        setDeliveryFee(0);
        setEstimatedDeliveryTime('');
        return;
      }

      // Delivery is available - set fee and time
      setDeliveryFee(data.fee || 0);
      setEstimatedDeliveryTime(data.estimatedDeliveryTime || '');
      setDeliveryError('');
    } catch (error) {
      console.error('Error getting delivery quote:', error);
      setDeliveryError('Could not calculate delivery distance. Please try a different address.');
      setDeliveryFee(0);
      setEstimatedDeliveryTime('');
    } finally {
      setIsLoadingDeliveryQuote(false);
    }
  };

  // Handle delivery method change
  const handleDeliveryMethodChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    if (method === 'pickup') {
      setDeliveryFee(0);
      setEstimatedDeliveryTime('');
      setDeliveryError('');
      setCustomerAddress('');
    } else {
      // Address field will be shown, wait for user input
      setDeliveryFee(0);
      setEstimatedDeliveryTime('');
    }
  };

  // Handle address change with debounce for DoorDash API calls
  const handleAddressChange = (address: string) => {
    console.log('Address changed:', { address, deliveryMethod, phoneLength: customerPhone.length });
    setCustomerAddress(address);
    if (deliveryMethod === 'delivery' && address.length > 10) {
      console.log('Triggering delivery quote for:', address);
      getDeliveryQuote(address, customerPhone);
    } else if (deliveryMethod === 'delivery' && address.length <= 10) {
      console.warn('Address too short for quote:', address);
    }
  };

  // Handle carousel quantity change
  const handleCarouselQuantityChange = (itemId: number, delta: number) => {
    const current = carouselQuantities[itemId] || 1;
    const newQuantity = Math.max(1, current + delta);
    setCarouselQuantities({ ...carouselQuantities, [itemId]: newQuantity });
  };

  // Handle add to cart from carousel
  const handleCarouselAddToCart = (item: MenuItem) => {
    const quantity = carouselQuantities[item.id] || 1;
    addItem(item, quantity);
    setCarouselQuantities({ ...carouselQuantities, [item.id]: 0 });
    setAddedFeedback(item.id);
    setTimeout(() => setAddedFeedback(null), 2000);
  };

  if (items.length === 0) {
    return (
      <div className="space-y-8">
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

        {/* Products Carousel */}
        {carouselItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Check out some delicious items!</h3>
            <div className="flex items-center gap-4">
              {/* Previous Button */}
              <button
                onClick={handleCarouselPrev}
                className="shrink-0 p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Carousel Items Container */}
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-6">
                  {displayItems.map((item) => (
                    <div
                      key={item.id}
                      className="shrink-0 w-1/3 border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                    >
                      {/* Item Image */}
                      <div className="relative h-40 w-full bg-gray-200">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-orange-200 to-amber-200">
                            <span className="text-4xl">🍕</span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 line-clamp-2">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        )}

                        {/* Price */}
                        <div className="mt-3 text-lg font-bold text-orange-600">
                          ${item.price.toFixed(2)}
                        </div>

                        {/* Quantity Selector & Add to Cart */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center border-2 border-orange-500 rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() => handleCarouselQuantityChange(item.id, -1)}
                              disabled={(carouselQuantities[item.id] || 1) <= 1}
                              className="p-1 bg-white hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition text-orange-600"
                            >
                              <Minus size={16} />
                            </button>

                            <span className="flex-1 text-center font-bold text-sm text-gray-900 px-2 py-1 min-w-8">
                              {carouselQuantities[item.id] || 1}
                            </span>

                            <button
                              onClick={() => handleCarouselQuantityChange(item.id, 1)}
                              className="p-1 bg-white hover:bg-orange-50 transition text-orange-600"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleCarouselAddToCart(item)}
                            className={`flex-1 py-1 px-2 rounded-lg font-semibold transition flex items-center justify-center gap-1 text-sm ${
                              addedFeedback === item.id
                                ? 'bg-green-500 text-white'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          >
                            <ShoppingCart size={14} />
                            {addedFeedback === item.id ? 'Added!' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={handleCarouselNext}
                className="shrink-0 p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}
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

          {/* Delivery Method Selection */}
          <div className="mb-8 p-6 bg-amber-50 rounded-xl border-2 border-orange-300">
            <h3 className="text-lg font-bold text-orange-700 mb-4">🚗 How would you like your order?</h3>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => handleDeliveryMethodChange('pickup')}
                  className="w-5 h-5 text-orange-500 cursor-pointer"
                />
                <span className="ml-3 text-lg font-semibold text-gray-900">🏪 Pickup</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={() => handleDeliveryMethodChange('delivery')}
                  className="w-5 h-5 text-orange-500 cursor-pointer"
                />
                <span className="ml-3 text-lg font-semibold text-gray-900">🚚 Delivery</span>
              </label>
            </div>
          </div>

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

            {/* Delivery Address - Only show for delivery */}
            {deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-lg font-bold text-orange-700 mb-2">
                  📍 Delivery Address *
                </label>
                <div className="bg-amber-50 border-3 border-orange-300 rounded-xl p-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500 transition">
                  <AddressInput
                    value={customerAddress}
                    onChange={handleAddressChange}
                    placeholder="123 Main St, Apt 4B, Mississauga, ON L5A 1A1"
                  />
                </div>
                {isLoadingDeliveryQuote && (
                  <p className="mt-2 text-sm text-blue-600 font-medium">⏳ Calculating delivery fee...</p>
                )}
                {deliveryError && (
                  <p className="mt-2 text-sm text-orange-600">{deliveryError}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              {isProcessing ? '⏳ Processing...' : '💳 Proceed to Payment'}
            </button>
          </form>
        </div>
      </div>

      {/* Cart Total Sidebar */}
      <div>
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {deliveryMethod === 'delivery' ? '🚚 Delivery Order' : '🏪 Pickup Order'}
          </h2>

          {deliveryMethod === 'delivery' && estimatedDeliveryTime && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm text-green-800 font-semibold">
                ⏱️ Estimated Delivery: <span className="text-base">{estimatedDeliveryTime}</span>
              </p>
            </div>
          )}

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {deliveryMethod === 'delivery' && (
              <>
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>Delivery Fee</span>
                  <span>
                    {isLoadingDeliveryQuote ? '⏳ Calculating...' : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                {isLoadingDeliveryQuote && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Tax (13%)</span>
              <span>${((total + deliveryFee) * 0.13).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>Total</span>
              <span className="text-orange-600">
                ${((total + deliveryFee) * 1.13).toFixed(2)}
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
