import { NextResponse } from "next/server";
import { upsertUserByEmail, updateUserRole } from "@/lib/db";
import { getSession, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { enterAsSchema, roleSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = enterAsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, role } = parsed.data;

  // Find or create the user, and keep their role current.
  const user = upsertUserByEmail({ name, email, role });

  setSessionCookie({ userId: user.id, role: role });

  return NextResponse.json({ user: { id: user.id, name: user.name, role } });
}

// PATCH — switch the current user between booking and hosting.
export async function PATCH(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = roleSchema.safeParse(body?.role);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = updateUserRole(session.userId, parsed.data);

  setSessionCookie({ userId: user.id, role: parsed.data });
  return NextResponse.json({ role: parsed.data });
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
