import { NextResponse } from "next/server";
import { upsertUserByEmail } from "@/lib/db";
import { getSession } from "@/lib/session";
import { adminCreateUserSchema } from "@/lib/validations";

// POST /api/admin/users — create a user (or update name/role if the email
// already exists). Super admin only. This is the only way to grant ADMIN
// access, since Google sign-in never assigns anything but SELLER.
export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminCreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await upsertUserByEmail(parsed.data);
  return NextResponse.json({ user }, { status: 201 });
}
