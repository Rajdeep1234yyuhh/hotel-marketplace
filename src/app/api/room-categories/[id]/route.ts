import { NextResponse } from "next/server";
import { findRoomCategoryById, findHotelById, updateRoomCategoryBase } from "@/lib/db";
import { getSession, canManageListing } from "@/lib/session";
import { updateRoomCategoryBaseSchema } from "@/lib/validations";

// PATCH /api/room-categories/[id] — update a room category's base price
// and/or room count (Rates & Inventories "By Room Type" tab). Owner,
// granted manager, or super admin of the parent hotel only.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const category = await findRoomCategoryById(params.id);
  if (!category) {
    return NextResponse.json({ error: "Room category not found" }, { status: 404 });
  }

  const hotel = await findHotelById(category.hotelId);
  if (!hotel || !(await canManageListing(hotel, session))) {
    return NextResponse.json(
      { error: "You can only manage room categories for your own listings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateRoomCategoryBaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await updateRoomCategoryBase(params.id, parsed.data);
  return NextResponse.json({ roomCategory: updated });
}
