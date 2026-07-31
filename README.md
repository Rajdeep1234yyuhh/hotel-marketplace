# Travel Grid India — Two-Sided Hotel Marketplace

A Next.js (App Router) marketplace where a user chooses to be a **buyer** (book
stays), a **seller/host** (list properties and take bookings), or an **admin**
(oversee the whole marketplace). Built to be runnable locally with zero
external services.

## Stack

- **Next.js 14** (App Router, Route Handlers, Server Components)
- **TypeScript** (strict)
- **Firebase Admin SDK / Firestore** (`src/lib/db.ts`) — server-only data
  access
- **NextAuth.js** — handles the "Continue with Google" OAuth handshake; its
  result is bridged into the app's own cookie session (see "Auth" below)
- **Tailwind CSS** with a custom hospitality theme
- **Zod** for end-to-end request validation
- Cookie-based session (`src/lib/session.ts`) that also accepts a real,
  verified Google identity — see "Auth" below

## Getting started

Requires Node.js 18.18+ and a Firebase project with Firestore enabled.

1. In the [Firebase Console](https://console.firebase.google.com), create a
   project (or use an existing one) and enable **Firestore Database** (Native
   mode).
2. Go to **Project Settings > Service Accounts > Generate new private key**.
   This downloads a JSON file with `project_id`, `client_email`, and
   `private_key`.
3. Copy `.env.example` to `.env` and fill in `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from that file (keep
   the private key's `\n` sequences literal — see the comment in
   `.env.example`).
4. For "Continue with Google" (see "Auth" below): create an OAuth 2.0 **Web
   application** client in [Google Cloud Console](https://console.cloud.google.com)
   (APIs & Services > Credentials). Add
   `{NEXTAUTH_URL}/api/auth/callback/google` (e.g.
   `http://localhost:3000/api/auth/callback/google` for local dev) to its
   **Authorised redirect URIs**. Put the client ID/secret in
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. Generate `NEXTAUTH_SECRET` (`openssl rand -base64 32`, or see the comment
   in `.env.example`) and set `NEXTAUTH_URL` to wherever the app runs.
6. If deploying to Vercel, add all of the above variables in the project's
   **Settings > Environment Variables** — including a production
   `NEXTAUTH_URL` and a matching redirect URI on the OAuth client.

```bash
npm install            # installs deps
npm run db:seed        # loads demo users + 4 sample hotels into Firestore
npm run dev            # http://localhost:3000
```

Re-seeding at any time wipes and rebuilds the demo data, so it's safe to
re-run.

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

### Auth

There are three ways in, all ending in the same `hm_session` cookie
(`{ userId, role }`) that every page/route already checks:

- **Continue with Google** — `GoogleSignInButton` calls NextAuth's
  `signIn("google", { callbackUrl: "/api/auth/bridge?role=..." })`, which
  redirects through Google's real OAuth flow (config in
  `src/lib/auth-options.ts`, routed via `src/app/api/auth/[...nextauth]`).
  Once that completes, `/api/auth/bridge` reads NextAuth's verified session,
  upserts the matching Firestore user, and issues our own session cookie —
  NextAuth's own session/JWT is never used elsewhere in the app.
- **`/login`** — email-only lookup for returning users (`/api/auth/login`).
  Doesn't let you pick a role; you get whatever role you already have, and
  it 404s clearly if the email isn't registered yet.
- **`/#get-started`** — the original no-password demo form (name, email,
  role tiles), unchanged.

All three are self-selected BUYER/SELLER only — see the `ADMIN` note above —
and all three explicitly refuse to sign in an existing `ADMIN` account (403),
so no public path can touch or downgrade it.

### API

| Endpoint                    | Methods             | Notes                                     |
| ---------------------------- | -------------------- | ------------------------------------------ |
| `/api/session`               | POST, PATCH, DELETE | Enter as role (demo form), switch role, sign out |
| `/api/auth/[...nextauth]`    | GET, POST            | NextAuth's own routes (sign-in, callback, etc.) |
| `/api/auth/bridge`           | GET                  | Turns a completed NextAuth sign-in into our session cookie |
| `/api/auth/login`            | POST                 | Look up an existing user by email, sign them back in |
| `/api/hotels`                | GET, POST            | List/search; create with room categories (sellers only) |
| `/api/hotels/[id]`           | GET, PATCH, DELETE   | Read one; publish toggle / delete (owner or admin) |
| `/api/bookings`              | POST                 | Create booking; priced server-side off the selected room category |

## Demo accounts

The seed creates `seller@demo.test`, `buyer@demo.test`, and an `admin@demo.test`
(not reachable via sign-in yet, see above). Sign in with any name/email from
the landing page — no password required.

## Moving to production

1. NextAuth now handles real Google identity verification, but authorization
   (`getSession`, `getCurrentUser`, roles) still runs on the lightweight
   `hm_session` cookie in `src/lib/session.ts`. To go further, either drive
   role/session state directly off NextAuth's session (removing the bridge
   step) or keep the bridge and add more real providers to
   `src/lib/auth-options.ts`. Either way, this is where the `ADMIN` role
   should get a real, non-self-service assignment path.
2. Add a real payment provider in `/api/bookings` (e.g. Razorpay/Stripe) before
   marking a booking `CONFIRMED`.
