# Verandah — Two-Sided Hotel Marketplace

A Next.js (App Router) marketplace where a user chooses to be a **buyer** (book
stays) or a **seller/host** (list properties and take bookings). Built to be
runnable locally with zero external services.

## Stack

- **Next.js 14** (App Router, Route Handlers, Server Components)
- **TypeScript** (strict)
- **Prisma** ORM with **SQLite** (swap to Postgres for production)
- **Tailwind CSS** with a custom hospitality theme
- **Zod** for end-to-end request validation
- Cookie-based demo session (designed to be replaced by NextAuth/Auth.js)

## Getting started

Requires Node.js 18.18+.

```bash
npm install            # installs deps and runs `prisma generate`
npm run db:push        # creates the SQLite schema (prisma/dev.db)
npm run db:seed        # loads demo users + 4 sample hotels
npm run dev            # http://localhost:3000
```

Or reset the database at any time:

```bash
npm run db:reset       # force-reset schema + reseed
```

## How it works

| Route             | Who        | Purpose                                            |
| ----------------- | ---------- | -------------------------------------------------- |
| `/`               | everyone   | Hero + role picker (book vs. host)                 |
| `/browse`         | everyone   | Buyer grid of published stays + search             |
| `/hotels/[id]`    | everyone   | Stay detail + booking widget (live pricing)        |
| `/seller`         | sellers    | Host dashboard: your listings + booking counts     |
| `/seller/new`     | sellers    | Add-a-property form with live card preview         |

Switch between booking and hosting anytime from the top bar — the same account
can do both.

### API

| Endpoint              | Methods            | Notes                                  |
| --------------------- | ------------------ | -------------------------------------- |
| `/api/session`        | POST, PATCH, DELETE| Enter as role, switch role, sign out   |
| `/api/hotels`         | GET, POST          | List/search; create (sellers only)     |
| `/api/hotels/[id]`    | GET, DELETE        | Read one; delete (owner only)          |
| `/api/bookings`       | POST               | Create booking; total priced server-side |

## Demo accounts

The seed creates `seller@demo.test` and `buyer@demo.test`, but you can sign in
with any name/email from the landing page — no password required.

## Moving to production

1. Point `DATABASE_URL` at managed Postgres and set `provider = "postgresql"`
   in `prisma/schema.prisma`.
2. Replace `src/lib/session.ts` with NextAuth/Auth.js. Only `getSession`,
   `getCurrentUser`, `setSessionCookie`, and `clearSessionCookie` are consumed
   by the app, so the surface to swap is small.
3. Add a real payment provider in `/api/bookings` (e.g. Razorpay/Stripe) before
   marking a booking `CONFIRMED`.
