import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const menuItems = [
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

async function updateMenuImages() {
  console.log('Updating menu item images...');

  for (const item of menuItems) {
    const { error } = await supabase
      .from('menu_items')
      .update({ image_url: item.image_url })
      .eq('name', item.name);

    if (error) {
      console.error(`Error updating ${item.name}:`, error);
    } else {
      console.log(`✓ Updated ${item.name}`);
    }
  }

  console.log('Done!');
}

updateMenuImages().catch(console.error);
