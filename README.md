# Joe's Pizza GTA - Restaurant Delivery MVP

A full-stack restaurant delivery MVP built with Next.js, Stripe, Supabase, and DoorDash Drive integration.

## Current Status: Phase 2 ✅ Complete

### Phase 1: Project Setup & Base Structure ✅ Completed
- ✅ Next.js 15 with App Router and TypeScript
- ✅ TailwindCSS v4 with custom restaurant theme
- ✅ Navbar with Home/Menu navigation links
- ✅ Footer with restaurant info & quick links
- ✅ All dependencies installed & environment variables configured
- ✅ Deployed to Vercel

### Phase 2: Supabase Setup & Database Schema ✅ Completed
**Goal:** Relational database for menu/orders with RLS security
**Status:** ✅ Completed

#### What was done:
- ✅ Created 4 database tables:
  - `restaurants` - Store restaurant info (hardcoded Joe's Pizza GTA, id=1)
  - `categories` - Menu categories (Appetizers, Pizzas)
  - `menu_items` - Individual menu items with prices & images
  - `orders` - Customer orders with items, totals, and statuses
- ✅ Seeded sample data:
  - 2 categories (Appetizers, Pizzas)
  - 6 menu items with Unsplash images and prices
- ✅ Enabled Row Level Security (RLS):
  - Public read access to menu (restaurants, categories, menu_items)
  - Public can create/read orders (restricted to restaurant_id=1)
  - Authenticated users can update/delete orders
- ✅ Created `lib/supabase.ts` with:
  - Client-side Supabase client (browser)
  - Server-side Supabase client (API routes & server components)
  - Type definitions (Restaurant, Category, MenuItem, Order)
  - Utility functions for common queries:
    - `getRestaurant()` - Fetch restaurant info
    - `getMenu()` - Fetch menu with categories and items
    - `createOrder()` - Create new order
    - `getOrder()` - Fetch order by ID
    - `updateOrderStatus()` - Update order (server-side)
- ✅ Tested database connection locally

#### Files created/modified:
- `lib/supabase.ts` - Supabase client utilities and type definitions
- Database schema created in Supabase console (not in code)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Upcoming Phases

### Phase 3: SEO-Optimized Menu Page (Next)
- Server-rendered menu with categories
- Mobile-first UI with Next/Image
- Shopping cart context
- Dynamic SEO metadata

### Phase 4: Restaurant Auth & Admin Dashboard
- Email/password authentication
- Protected admin routes
- Order management
- Menu item editing

### Phase 5: Stripe Checkout Integration
- Payment checkout flow
- Webhook handling
- Order confirmation

### Phase 6: DoorDash Drive Integration
- Delivery quotes & dispatch
- Order tracking

### Phase 7: Order Tracking & Polish
- Real-time order tracking
- SMS notifications
- Final optimization

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS v4
- **Database:** Supabase
- **Payments:** Stripe
- **Delivery:** DoorDash Drive API
- **Language:** TypeScript

## Environment Variables

Configured in `.env.local`:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key (exposed to client)
- `STRIPE_SECRET_KEY` - Stripe secret key (server-side only)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase public key (exposed to client)
- `SUPABASE_SECRET_KEY` - Supabase secret key (server-side only)

## Deploy

```bash
npm run build
npm start
```

Ready to deploy to Vercel once all phases are complete.
