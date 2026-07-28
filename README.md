# Travel Grid India — Two-Sided Hotel Marketplace

A Next.js (App Router) marketplace where a user chooses to be a **buyer** (book
stays), a **seller/host** (list properties and take bookings), or an **admin**
(oversee the whole marketplace). Built to be runnable locally with zero
external services.

## Stack

- **Next.js 14** (App Router, Route Handlers, Server Components)
- **TypeScript** (strict)
- **JSON file data store** (`src/lib/db.ts`, backed by `data/db.json`) — a
  placeholder until Firebase is wired up; see "Moving to production" below
- **Tailwind CSS** with a custom hospitality theme
- **Zod** for end-to-end request validation
- Cookie-based demo session (designed to be replaced by NextAuth/Auth.js)

## Getting started

Requires Node.js 18.18+.

```bash
npm install            # installs deps
npm run db:seed        # loads demo users + 4 sample hotels into data/db.json
npm run dev            # http://localhost:3000
```

Re-seeding at any time replaces `data/db.json` with fresh demo data (it wipes
and rebuilds, so it's safe to re-run).

## How it works

| Route             | Who        | Purpose                                            |
| ----------------- | ---------- | -------------------------------------------------- |
| `/`               | everyone   | Hero + role picker (book vs. host)                 |
| `/browse`         | everyone   | Buyer grid of published stays + search             |
| `/hotels/[id]`    | everyone   | Stay detail, room categories, map + booking widget |
| `/seller`         | sellers    | Host dashboard: your listings + booking counts     |
| `/seller/new`     | sellers    | Add-a-property form (room categories, contact/payout info, location, meal plans) |
| `/admin`          | admins     | Super-admin view of every hotel, owner, and user   |

Switch between booking and hosting anytime from the top bar — the same account
can do both. There is no public sign-in path to the `ADMIN` role (see
`src/lib/session.ts`); it's reserved for whatever real auth system replaces
the demo session.

### API

| Endpoint              | Methods                  | Notes                                     |
| --------------------- | ------------------------ | ------------------------------------------ |
| `/api/session`        | POST, PATCH, DELETE      | Enter as role, switch role, sign out       |
| `/api/hotels`         | GET, POST                | List/search; create with room categories (sellers only) |
| `/api/hotels/[id]`    | GET, PATCH, DELETE       | Read one; publish toggle / delete (owner or admin) |
| `/api/bookings`       | POST                     | Create booking; priced server-side off the selected room category |

## Demo accounts

The seed creates `seller@demo.test`, `buyer@demo.test`, and an `admin@demo.test`
(not reachable via sign-in yet, see above). Sign in with any name/email from
the landing page — no password required.

## Moving to production

1. Replace `src/lib/db.ts` with Firebase (Firestore) calls, keeping the same
   exported function signatures (`findHotelById`, `listHotels`, `createHotel`,
   etc.) so call sites don't need to change. The JSON file store does **not**
   persist correctly on serverless platforms like Vercel (ephemeral
   filesystem) — it's only reliable for local development.
2. Replace `src/lib/session.ts` with NextAuth/Auth.js. Only `getSession`,
   `getCurrentUser`, `setSessionCookie`, and `clearSessionCookie` are consumed
   by the app, so the surface to swap is small. This is also where the
   `ADMIN` role would get a real, non-self-service assignment path.
3. Add a real payment provider in `/api/bookings` (e.g. Razorpay/Stripe) before
   marking a booking `CONFIRMED`.
