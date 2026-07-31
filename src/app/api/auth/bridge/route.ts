import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { findUserByEmail, upsertUserByEmail } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

// GET /api/auth/bridge
//
// NextAuth handles the actual Google OAuth handshake and redirects here once
// it's done. This route reads NextAuth's (already-verified) session, upserts
// the matching user in Firestore, and issues our own hm_session cookie — the
// same one every other route/page in the app already checks via getSession().
//
// This is the ONLY path that grants hosting (SELLER) access — there is no
// role parameter here on purpose. Browsing and booking never need a session
// at all, so Google sign-in has exactly one outcome: become a host.
export async function GET(req: Request) {
  const { origin } = new URL(req.url);

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // Never let a Google sign-in downgrade an existing ADMIN account.
  const existing = await findUserByEmail(email);
  if (existing?.role === "ADMIN") {
    return NextResponse.redirect(new URL("/", origin));
  }

  const name = session.user?.name?.trim() || email.split("@")[0];
  const user = await upsertUserByEmail({ name, email, role: "SELLER" });

  setSessionCookie({ userId: user.id, role: "SELLER" });

  return NextResponse.redirect(new URL("/seller", origin));
}
