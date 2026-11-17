# Eats Seychelles — four-role food delivery marketplace (front end)

A front-end prototype of a food delivery marketplace, built mobile-first and modelled on Uber Eats, with four role views:
**Customer**, **Restaurant Merchant**, **Courier Partner** and **Platform Admin**.
All four share one client-side store. An order placed as a Customer appears in the Merchant KDS,
gets offered to the Courier, and shows up in the Admin live-orders table.

**Market: Seychelles.** Prices are in Seychelles Rupee (SCR), VAT is 15%, and the addresses, stores and couriers are on Mahé, Praslin and La Digue.

Stack: React 19, TypeScript, Vite, React Router 7, Tailwind CSS 3, Lucide icons. Maps, charts, audio alerts and
photo proof work without any API keys.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check and build to dist/
```

The router uses clean URLs by default. Set `VITE_ROUTER=hash` (static hosts with no rewrites) or
`VITE_ROUTER=memory` (sandboxed iframes) at build time to change that. Clean-URL builds load assets
from `/`; hash and memory builds use relative paths so they run from any sub-folder. Set
`BASE_PATH=/some/path/` to override.

## Test it

```bash
npm test                         # unit tests (Vitest): fee engine, formatting, store reducer
npm run test:watch               # unit tests in watch mode
npx playwright install chromium  # one-time browser download
npm run test:e2e                 # browser tests (Playwright) against the production build, desktop + mobile
```

The browser tests open every route directly, and run the main cross-role flow: order from Kaz Kreol
with the required options and a promo code, then check the order appears in the Merchant KDS.

## GitHub: CI and publishing

- `.github/workflows/ci.yml` runs on every push and pull request: lint, unit tests, build, then the
  Playwright tests. If browser tests fail, the report and screenshots are uploaded as the
  `playwright-report` artifact on the run.
- `.github/workflows/deploy.yml` publishes to GitHub Pages on every push to `main`, at
  `https://<user>.github.io/<repo>/`. It builds with `VITE_ROUTER=hash` because Pages can't rewrite
  deep links, so URLs look like `/#/merchant`.
  **One-time setup:** repo **Settings → Pages → Source: GitHub Actions**.

## Routes

| Path | View |
|---|---|
| `/` | Customer: discovery feed |
| `/search` | Customer: search tab (mobile) |
| `/store/:id` | Customer: storefront and menu |
| `/track/:orderId` | Customer: live order tracking (split-screen map) |
| `/orders`, `/account` | Customer: orders history, account |
| `/merchant` | Merchant: live order KDS (3-column Kanban) |
| `/merchant/menu` | Merchant: menu, modifier groups, 86 toggles, store status |
| `/courier` | Courier: dashboard, heatmap, job offers, active trip |
| `/admin` | Admin: live metrics overview |
| `/admin/onboarding` | Admin: restaurant approval queue |
| `/admin/fees` | Admin: commission and fee configuration |
| `/admin/disputes` | Admin: dispute resolution log |
| `/admin/partners` | Admin: partner listing plans, overdue stores, trip commission, platform earnings |
| `/merchant/billing` | Merchant: listing plan, pay/renew SCR 200, payment history, payout statement |
| `/partner` | Partner landing: how it works, pricing, requirements, status lookup |
| `/partner/apply` | Partner registration: 5 steps — business, contact, documents + cover photo, plan, payment |
| `/partner/status/:id` | Partner application status and receipt |
| `/credits` | Photo credits (Wikimedia Commons licences) |

## Partner registration and billing

Restaurants sign up at `/partner/apply`, pay their first month, and wait for approval:

1. **Business**: name, what they serve, categories, business registration number, island and address.
2. **Contact**: owner, Seychelles phone number (+248, 7 digits), email.
3. **Documents**: cover photo (shrunk in the browser), trade licence, food hygiene certificate, proof of bank
   account. The menu can be added later.
4. **Plan**: tier (Standard 30% / Plus 25% / Premium 20% of food sales) and the partner terms.
5. **Payment**: SCR 200 first month by card, mobile banking or bank transfer (simulated, see below).

The application then appears in **Admin → Onboarding** with the payment reference. Approving it puts the store
in the customer feed with its own photo, and its 30-day listing starts.

**Pricing model** (edit in Admin → Fees & commission, logic in `src/lib/billing.ts`):

- **SCR 200 listing fee every 30 days** per restaurant. Paying early adds 30 days to the end of the plan; paying
  after it lapses restarts from today. Merchants pay or renew in **Merchant → Billing**. Overdue stores get a
  banner and are flagged in **Admin → Partners & billing**.
- **SCR 15 per delivered trip**, deducted from the restaurant's payout. Pickup orders have no trip fee.
- **Tier commission** on food sales, as before.
- Platform earnings (listing fees + trip commission + tier commission) appear on the Admin overview.

**Prototype limits:**

- **No real payments.** The payment step is clearly marked as a demo, and no card details are collected. To
  take real money, add a backend with a Seychelles payment gateway: redirect to the bank's hosted payment page,
  confirm the payment on the server, and only then create the application or extend the plan.
- **Data is stored in this browser only.** Without a backend, registrations, approvals, payments and fee changes
  are kept in `localStorage` (`eats-seychelles:v1`). They survive a refresh but aren't shared between devices.
  Admin → *Reset demo data* clears them.
- Uploaded documents keep only the file name, and the cover photo is kept in the browser.

## Photos

Store covers and banners are freely licensed photos from Wikimedia Commons, stored in `public/images`. They show
Seychelles scenery (Anse Source d'Argent, Beau Vallon, the Victoria clock tower, Sir Selwyn Selwyn-Clarke Market)
and generic food matching each store. They aren't photos of the businesses listed. The licences require
attribution, which is on the `/credits` page (data in `src/data/credits.ts`). Partners replace the stock photo
with their own when they register.

## Folder structure

```
src/
├── App.tsx                     # Router + role routes
├── main.tsx
├── index.css                   # Tailwind layers, design tokens (.btn, .pill, .card, .input…)
├── config/market.ts            # Country settings: currency SCR, locale, 15% VAT, islands, region label
├── types/index.ts              # Domain model = future API contracts
├── data/mock.ts                # Restaurants, menus, modifiers, couriers, seed orders, disputes…
├── store/AppStore.tsx          # useReducer store, actions, selectors (swap for API/websocket later)
├── lib/
│   ├── format.ts               # Money/time formatting (reads config/market.ts), cn(), ids
│   └── pricing.ts              # Fee engine: service/small-order/priority fees, VAT, promo codes
├── hooks/index.ts              # useNow, useInterval, useMediaQuery, useLockBody, playAlert (WebAudio)
├── components/
│   ├── layout/RoleSwitcher.tsx # Sticky preview bar at the very top
│   └── ui/
│       ├── Modal.tsx           # Bottom sheet (mobile) / centred dialog (desktop)
│       ├── Drawer.tsx          # Full-screen (mobile) / right slide-over (desktop)
│       ├── CityMap.tsx         # Vector map, route, courier marker, heat zones, pointAlong()
│       └── primitives.tsx      # Toggle, Skeleton, Badge, QtyStepper, CountdownRing, Segmented…
└── features/
    ├── customer/               # Layout, DiscoveryFeed, RestaurantCard, Storefront, ItemModal,
    │                           # CartDrawer (cart + checkout), OrderTracking (+ chat/call), Orders, Account
    ├── merchant/               # MerchantPortal, KDSBoard, MenuManager (item + modifier CRUD)
    ├── courier/                # CourierApp (dispatch, offer card, 5-step trip, earnings)
    └── admin/                  # AdminDashboard (overview, onboarding, fees, disputes)
```

## Try the cross-role flow

1. **Customer**: open *Kaz Kreol*, add the Octopus Curry (required options are validated), check out with promo `EATS20`.
2. On the tracking screen, turn **Demo auto-advance** off.
3. **Merchant**: the order is under *New incoming*, with a countdown and an alert (turn sound on in the header). Accept it and pick a prep time, then *Mark ready*.
4. **Courier**: tap *Go online*. The waiting order is offered to you. Accept it, then Check in, Verify items, Navigate, and finish with Photo proof (use your camera, or *Use demo photo*).
5. Go back to **Customer**: the order moves through each stage live. **Admin** shows it in the live-orders table.

Other connected behaviour:
- Pausing a store, Busy Mode (+15 min) and 86'ing an item in Merchant all show up immediately on Customer store cards and menus.
- Fee changes published in Admin → Fees change Customer checkout totals straight away.
- Approving a restaurant in Admin → Onboarding adds it to the Customer feed.

## Wiring a backend

- Keep `types/index.ts` as the contract. Replace each reducer action in `store/AppStore.tsx` with an API mutation
  (React Query or tRPC work well), and push order-status changes over a websocket channel per order or per store.
- Move `computeFees` (`lib/pricing.ts`) to the server, so prices can't be changed on the client. Keep the client copy for estimates.
- To use real maps, swap `CityMap` for Mapbox GL or Google Maps. `pointAlong` already interpolates courier GPS along a route.
- The audio alert (`playAlert`) needs one user gesture before browsers allow it. The sound toggle provides that gesture.
- All country settings are in `src/config/market.ts`, and the catalogue (stores, menus, addresses, couriers) is in `src/data/mock.ts`. To launch another market, copy those two files.
