import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { findUserByEmail, upsertUserByEmail } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { isFixedSuperAdmin } from "@/lib/super-admins";

// GET /api/auth/bridge
//
// NextAuth handles the actual Google OAuth handshake and redirects here once
// it's done. This route reads NextAuth's (already-verified) session, upserts
// the matching user in Firestore, and issues our own hm_session cookie — the
// same one every other route/page in the app already checks via getSession().
//
// This is the ONLY path that grants hosting (SELLER) access — there is no
// role parameter here on purpose. Browsing and booking never need a session
// at all, so Google sign-in has exactly one outcome: become a host, UNLESS
// the email is a fixed super admin (SUPER_ADMIN_EMAILS), which always signs
// in as ADMIN regardless of whatever role is currently stored for it.
export async function GET(req: Request) {
  const { origin } = new URL(req.url);

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const name = session.user?.name?.trim() || email.split("@")[0];

  if (isFixedSuperAdmin(email)) {
    const user = await upsertUserByEmail({ name, email, role: "ADMIN" });
    setSessionCookie({ userId: user.id, role: "ADMIN" });
    return NextResponse.redirect(new URL("/admin", origin));
  }

  // Never let a Google sign-in downgrade an existing ADMIN account (one
  // promoted manually via the admin panel) — but still let them in as
  // ADMIN, rather than blocking sign-in entirely.
  const existing = await findUserByEmail(email);
  if (existing?.role === "ADMIN") {
    setSessionCookie({ userId: existing.id, role: "ADMIN" });
    return NextResponse.redirect(new URL("/admin", origin));
  }

  const user = await upsertUserByEmail({ name, email, role: "SELLER" });

  setSessionCookie({ userId: user.id, role: "SELLER" });

  return NextResponse.redirect(new URL("/seller", origin));
}
