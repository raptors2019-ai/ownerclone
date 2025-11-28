# Joe's Pizza GTA - Restaurant Delivery MVP

A full-stack restaurant delivery MVP built with Next.js, Stripe, Supabase, and DoorDash Drive integration.

## Current Status: Phase 1 ✅ Complete

### Phase 1: Project Setup & Base Structure
**Goal:** Scaffolding + basic deploy infrastructure
**Status:** ✅ Completed

#### What was done:
- ✅ Next.js 15 with App Router and TypeScript
- ✅ TailwindCSS v4 with custom restaurant theme (warm pizza colors)
- ✅ Navbar with Home/Menu navigation links
- ✅ Footer with restaurant info & quick links
- ✅ SEO metadata for Joe's Pizza GTA
- ✅ Installed all Phase 1 dependencies:
  - @supabase/supabase-js (database)
  - stripe & @stripe/stripe-js (payments)
  - @stripe/react-stripe-js (payment forms)
  - lucide-react (icons)
- ✅ Environment variables configured (.env.local with Stripe test keys)

#### Files created/modified:
- `app/layout.tsx` - Main layout with navbar & footer
- `tailwind.config.ts` - Restaurant theme configuration
- `.env.local` - Stripe test API keys (already configured)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Upcoming Phases

### Phase 2: Supabase Setup & Database Schema (Next)
- Create Supabase project (free tier)
- Setup database schema: restaurants, categories, menu_items, orders
- Enable Row Level Security (RLS)
- Seed sample menu data

### Phase 3: SEO-Optimized Menu Page
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

## Deploy

```bash
npm run build
npm start
```

Ready to deploy to Vercel once all phases are complete.
