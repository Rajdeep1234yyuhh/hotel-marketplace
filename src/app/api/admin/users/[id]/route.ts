import { NextResponse } from "next/server";
import { findUserById, updateUserRole, deleteUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { updateUserRoleSchema } from "@/lib/validations";
import { isFixedSuperAdmin } from "@/lib/super-admins";

// PATCH /api/admin/users/[id] — change a user's role. Super admin only.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  if (params.id === session.userId) {
    return NextResponse.json(
      { error: "You can't change your own role" },
      { status: 400 }
    );
  }

  const target = await findUserById(params.id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (isFixedSuperAdmin(target.email)) {
    return NextResponse.json(
      { error: "This account is a fixed super admin and can't be changed here" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await updateUserRole(params.id, parsed.data.role);
  return NextResponse.json({ user });
}

// DELETE /api/admin/users/[id] — remove a user. Super admin only.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  if (params.id === session.userId) {
    return NextResponse.json(
      { error: "You can't delete your own account" },
      { status: 400 }
    );
  }

  const target = await findUserById(params.id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (isFixedSuperAdmin(target.email)) {
    return NextResponse.json(
      { error: "This account is a fixed super admin and can't be deleted" },
      { status: 400 }
    );
  }

  await deleteUser(params.id);
  return NextResponse.json({ ok: true });
}
