import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const MENU_ITEMS_UPDATES = [
  {
    name: 'Garlic Breadsticks',
    image_url: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd13f6d?w=500&h=500&fit=crop',
  },
  {
    name: 'Mozzarella Sticks',
    image_url: 'https://images.unsplash.com/photo-1535920527894-b0b06b648401?w=500&h=500&fit=crop',
  },
  {
    name: 'Margherita',
    image_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&h=500&fit=crop',
  },
  {
    name: 'Pepperoni',
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=500&h=500&fit=crop',
  },
  {
    name: 'Vegetarian',
    image_url: 'https://images.unsplash.com/photo-1515182629504-727d7753751d?w=500&h=500&fit=crop',
  },
  {
    name: 'Seafood',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561231?w=500&h=500&fit=crop',
  },
];

export async function POST(request: Request) {
  try {
    // TODO: Add authentication check here in production
    // For now, this is open for development purposes

    const results = [];

    for (const item of MENU_ITEMS_UPDATES) {
      const { error } = await supabaseServer
        .from('menu_items')
        .update({ image_url: item.image_url })
        .eq('name', item.name);

      if (error) {
        results.push({ name: item.name, status: 'error', message: error.message });
      } else {
        results.push({ name: item.name, status: 'success' });
      }
    }

    return NextResponse.json({
      message: 'Menu images updated',
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
