import { NextResponse } from "next/server";
import {
  addPackageManager,
  removePackageManager,
  findUserByEmail,
  updateUserRole,
} from "@/lib/db";
import { getSession } from "@/lib/session";
import { managerEmailSchema } from "@/lib/validations";

// POST /api/admin/packages/[id]/managers — grant a user (by email) the same
// manage access as the package's owner. Super admin only. If an account
// already exists for that email with the BUYER role, it's bumped to SELLER
// so the seller dashboard actually opens for them once they sign in.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = managerEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const tourPackage = await addPackageManager(params.id, parsed.data.email);
  if (!tourPackage) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const existingUser = await findUserByEmail(parsed.data.email);
  if (existingUser && existingUser.role === "BUYER") {
    await updateUserRole(existingUser.id, "SELLER");
  }

  return NextResponse.json({ package: tourPackage }, { status: 201 });
}

// DELETE /api/admin/packages/[id]/managers — revoke a manager's access.
// Super admin only.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = managerEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const tourPackage = await removePackageManager(params.id, parsed.data.email);
  if (!tourPackage) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  return NextResponse.json({ package: tourPackage });
}
