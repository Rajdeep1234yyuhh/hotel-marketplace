import { NextResponse } from "next/server";
import { addHotelManager, removeHotelManager, findUserByEmail, updateUserRole } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hotelManagerEmailSchema } from "@/lib/validations";

// POST /api/admin/hotels/[id]/managers — grant a user (by email) the same
// manage access as the hotel's owner. Super admin only. If an account
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
  const parsed = hotelManagerEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const hotel = await addHotelManager(params.id, parsed.data.email);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const existingUser = await findUserByEmail(parsed.data.email);
  if (existingUser && existingUser.role === "BUYER") {
    await updateUserRole(existingUser.id, "SELLER");
  }

  return NextResponse.json({ hotel }, { status: 201 });
}

// DELETE /api/admin/hotels/[id]/managers — revoke a manager's access.
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
  const parsed = hotelManagerEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const hotel = await removeHotelManager(params.id, parsed.data.email);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  return NextResponse.json({ hotel });
}
