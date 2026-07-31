import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/lib/validations";

// POST /api/auth/login — sign an existing user back in by email, keeping
// whatever role they already have. Unlike /api/session, this never creates
// a new account and never lets the caller pick/overwrite a role.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return NextResponse.json(
      { error: "No account found with that email. Try Get started instead." },
      { status: 404 }
    );
  }
  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "This account can't sign in here." },
      { status: 403 }
    );
  }

  setSessionCookie({ userId: user.id, role: user.role });
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
}
