import { cookies } from "next/headers";
import { findUserById } from "@/lib/db";

/**
 * Lightweight, demo-grade session.
 *
 * The signed-in user id and role are stored in an httpOnly cookie. This keeps
 * the project runnable with zero external setup. For production, replace this
 * module with NextAuth/Auth.js (the call sites only depend on `getSession`,
 * `getCurrentUser`, and `setSession`).
 */

const COOKIE = "hm_session";

// ADMIN is a recognized role for authorization checks (super-admin dashboard),
// but the public sign-in/switch-role endpoints only ever issue BUYER or SELLER —
// granting ADMIN is left to whatever real auth system replaces this demo session.
export type Role = "BUYER" | "SELLER" | "ADMIN";

export type Session = {
  userId: string;
  role: Role;
};

const VALID_ROLES: Role[] = ["BUYER", "SELLER", "ADMIN"];

export function getSession(): Session | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.userId || !VALID_ROLES.includes(parsed.role)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(session: Session) {
  cookies().set(COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return findUserById(session.userId);
}
