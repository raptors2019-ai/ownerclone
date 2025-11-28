import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client (for browser)
export const supabaseClient = createClient(
  supabaseUrl,
  supabasePublishableKey
);

// Server-side Supabase client (for API routes and server components)
export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceKey || supabasePublishableKey,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Types
export interface Restaurant {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface Category {
  id: number;
  restaurant_id: number;
  name: string;
  created_at: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  restaurant_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: any[];
  total: number;
  status: string;
  stripe_id: string | null;
  delivery_id: string | null;
  created_at: string;
}

// Utility functions for common queries
export async function getRestaurant(id: number) {
  const { data, error } = await supabaseClient
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function getMenu(restaurantId: number) {
  const { data, error } = await supabaseClient
    .from('categories')
    .select(`
      *,
      menu_items (*)
    `)
    .eq('restaurant_id', restaurantId)
    .order('name');

  if (error) throw error;
  return data as Array<Category & { menu_items: MenuItem[] }>;
}

export async function createOrder(
  restaurantId: number,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  items: any[],
  total: number
) {
  const { data, error } = await supabaseClient
    .from('orders')
    .insert([
      {
        restaurant_id: restaurantId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items,
        total,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrder(orderId: number) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as Order;
}

// Server-side function to update order (for webhooks, etc.)
export async function updateOrderStatus(
  orderId: number,
  status: string,
  stripeId?: string,
  deliveryId?: string
) {
  const updateData: any = { status };
  if (stripeId) updateData.stripe_id = stripeId;
  if (deliveryId) updateData.delivery_id = deliveryId;

  const { data, error } = await supabaseServer
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}
