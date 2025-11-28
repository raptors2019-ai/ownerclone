MVP Build Phases: Iterative Steps for Cursor/Claude

This is a 7-phase plan optimized for 1-2 days/phase (total ~1-2 weeks). Each phase has:

- Goal: What it achieves.

- Prerequisites: From prior phases.

- Tasks: 3-6 grouped, actionable steps.

- AI Prompts: Copy-paste ready for Cursor/Claude (e.g., "@claude refactor this...").

- Testing/Validation: Quick checks.

- Deploy Milestone: Vercel preview for each phase.

General Tips:

- Start: npx create-next-app@latest my-mvp --typescript --tailwind --app (App Router).

- Env: .env.local for Supabase/Stripe/DoorDash keys.

- Repo: GitHub private repo. Commit end-of-phase.

- Iterate: After each phase, vercel deploy --prebuilt, test live, then prompt AI: "Review this phase's code for bugs/security. Suggest improvements."

- Simplify MVP: Single hardcoded restaurant (id=1). No custom domains/multi-tenant yet.

- Costs: Free tiers (Supabase Starter, Vercel Hobby, Stripe/DoorDash test/sandbox).

---

Phase 1: Project Setup & Base Structure (1 day)

Goal: Scaffolding + basic deploy. No DB/UI yet.

Prerequisites: None.

Tasks:

1. Init Next.js project (App Router, Tailwind).

2. Install deps: npm i @supabase/supabase-js stripe stripe-js @stripe/react-stripe-js lucide-react (icons/UI).

3. Setup .env.local: Dummy keys (get real later).

4. Create basic layout (app/layout.tsx): Navbar (Home/Menu links), Footer.

5. Add global styles (Tailwind config for restaurant theme: warm colors).

6. Initial commit/deploy.

AI Prompts:

- "Set up a Next.js 15 App Router project with TailwindCSS optimized for restaurant menu (mobile-first, clean food images). Add a sticky bottom nav for cart. Include SEO meta structure in layout.tsx."

Testing/Validation:

- npm run dev: Homepage loads, responsive.

- Vercel deploy: Share preview URL.

Milestone: Live homepage skeleton (/menu stub).

---

Phase 2: Supabase Setup & Database Schema (1 day)

Goal: Relational DB for menu/orders. RLS basics.

Prerequisites: Phase 1 repo.

Tasks:

1. Create Supabase project (free tier). Get URL/anon key.

2. Schema (SQL Editor):

   CREATE TABLE restaurants (id SERIAL PRIMARY KEY, name TEXT, address TEXT);
   INSERT INTO restaurants (name, address) VALUES ('Joe''s Pizza GTA', '123 Mississauga Rd');

   CREATE TABLE categories (id SERIAL PRIMARY KEY, restaurant_id INT REFERENCES restaurants(id), name TEXT);
   CREATE TABLE menu_items (id SERIAL PRIMARY KEY, category_id INT REFERENCES categories(id), name TEXT, desc TEXT, price DECIMAL, image_url TEXT);
   CREATE TABLE orders (id SERIAL PRIMARY KEY, restaurant_id INT REFERENCES restaurants(id), customer_name TEXT, customer_phone TEXT, customer_address TEXT, items JSONB, total DECIMAL, status TEXT DEFAULT 'pending', stripe_id TEXT, delivery_id TEXT);
   - Seed sample data: 2 categories (Appetizers, Pizzas), 6 items (images from Unsplash).

3. Enable RLS: ALTER TABLE ... ENABLE ROW LEVEL SECURITY; CREATE POLICY "Restaurant 1 only" ON ... FOR ALL USING (restaurant_id = 1);

4. Create lib/supabase.ts: Client/server utils.

AI Prompts:

- "Write Supabase client for Next.js App Router (server + client components). Add RLS policy for restaurant_id=1. Include type-safe queries for menu_items (with categories join)."

Testing/Validation:

- Supabase dashboard: Data visible? RLS blocks other IDs?

- Local: Fetch menu in console (/api/test-menu route).

Milestone: DB live, queryable.

---

Phase 3: SEO-Optimized Menu Page (1-2 days)

Goal: Public-facing SSR menu. Core SEO/conversion.

Prerequisites: Phases 1-2.

Tasks:

1. app/menu/page.tsx: Server Component—fetch Supabase menu (join categories/items).

2. UI: Tabs for categories, grid cards (Next/Image, desc, price, "Add to Cart" btn).

3. Cart state: Context/Zustand (providers/cart.tsx), sticky bottom bar (item count/total).

4. SEO: Dynamic <title>/<meta>/OpenGraph per item. Schema.org JSON-LD for menu.

5. Mobile: Modals for modifiers (e.g., "Extra Cheese +$2").

AI Prompts:

- "Build SSR menu page in Next.js: Fetch Supabase menu_items with categories. Mobile-first cards (image left, details right, add-to-cart). Sticky cart bar. Dynamic SEO: Title='[Item] Delivery Mississauga | Joe''s Pizza'. Add JSON-LD structured data."

- "Create CartContext with Zustand. Add modal for item modifiers (array of {name, price})."

Testing/Validation:

- /menu: Loads fast (<2s FCP), SEO meta correct (Lighthouse 90+), add items → cart updates.

- Google "Joe's Pizza Mississauga" simulation.

Milestone: Browseable menu with cart. Deploy.

---

Phase 4: Restaurant Auth & Admin Dashboard (1 day)

Goal: Owner login + basic CRUD.

Prerequisites: Phases 1-3.

Tasks:

1. Supabase Auth: Email/password (or magic links).

2. Middleware: Protect /admin/\*.

3. app/admin/page.tsx: Server fetch orders/menu. Tables (TanStack Table lite).

4. CRUD: Edit menu items (forms), view orders list.

5. Logout/UI polish.

AI Prompts:

- "Integrate Supabase Auth (email) into Next.js. Protect /admin with middleware (redirect if not logged in as restaurant_id=1). Build dashboard: Table of orders (status/items), form to edit menu_items."

Testing/Validation:

- Signup /auth/signin → /admin: Edit item → DB updates. Non-auth → redirect.

Milestone: Owner can manage menu/orders.

---

Phase 5: Stripe Checkout Integration & Testing (1-2 days)

Goal: Payments work end-to-end (no DoorDash yet).

Prerequisites: Phases 1-4.

Tasks:

1. Stripe dashboard: Test keys, create product (SaaS sub stub).

2. Cart → Checkout page: Address form + Stripe Elements.

3. Server Action/API: Create PaymentIntent (total + tax). Webhook /api/stripe-webhook (save stripe_id, status='paid').

4. Success page: Confirm order in DB.

5. Test: Full flow (pay → DB order).

AI Prompts:

- "Integrate Stripe Checkout in Next.js: From CartContext, Server Action creates PaymentIntent (dynamic total). Elements form + address. Webhook verifies sig, updates Supabase orders.status='paid'. Use test keys."

- "Add Canadian tax calc (HST 13% GTA). Handle failures/chargebacks."

Testing/Validation:

- Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe-webhook.

- Test cards: 424242..., fail one. Orders table: stripe_id populated, status updates.

Milestone: Pay for pizza → Order saved. (Demo without delivery.)

---

Phase 6: DoorDash Drive Integration & Testing (1-2 days)

Goal: Logistics quote + dispatch post-payment.

Prerequisites: Phase 5 (payment webhook triggers).

Tasks:

1. DoorDash Dev: Sandbox account/key. Test addresses (Joe's: fake Mississauga coords).

2. Checkout: Quote API (pickup=restaurant, dropoff=customer → fee/ETA → add to total).

3. Webhook success → Create Delivery API (delivery_id to DB).

4. Error handling: Idempotency keys.

5. Test simulator.

AI Prompts:

- "Integrate DoorDash Drive API (sandbox): In checkout Server Action, call Quote API (hardcode pickup coords), add delivery_fee to Stripe total. On Stripe webhook 'payment_intent.succeeded', call Create Delivery, save delivery_id to Supabase. Verify webhooks with sig."

- "Add form validation: Validate addresses before quote."

Testing/Validation:

- DoorDash simulator: Quote → Pay → Create → Track statuses.

- Full flow: Order → Quote $7.50 → Pay → Delivery dispatched (sandbox dashboard).

Milestone: End-to-end order + simulated delivery.

---

Phase 7: Order Tracking, Polish & Demo-Ready (1 day)

Goal: Real-time UX + extras.

Prerequisites: All prior.

Tasks:

1. Tracking page (/order/[id]): Poll DoorDash status or webhook → UI (progress bar).

2. SMS: Twilio (free) on status changes.

3. Printer stub: /api/printer-poll → Order JSON.

4. SEO sitemap, images opt, Lighthouse 95+.

5. Demo script: Pre-seed menu, share URLs.

AI Prompts:

- "Build order tracking: Webhook listener updates DB status. Client poll every 10s for /order/[id]. Add Twilio SMS on 'delivered'. Star CloudPRNT endpoint: Poll pending orders → JSON ticket → mark printed."

- "Optimize SEO: Generate sitemap.xml with menu items. Next/Image everywhere."

Testing/Validation:

- Simulate full delivery lifecycle. SMS arrives. Lighthouse audit.

- Final Demo: Record video: Browse → Order → Pay → Track → Admin view.

Milestone: Production-ready demo. Hand off to friend: "Live at demo-pizza.vercel.app. Signup as owner@pizza.com."
