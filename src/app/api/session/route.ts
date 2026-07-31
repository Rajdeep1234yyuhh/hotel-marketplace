import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

// Sign-out only. There is no manual signup or role-switch path anymore —
// hosting access is granted exclusively through /api/auth/bridge (Google),
// and browsing/booking never need a session at all.
export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
