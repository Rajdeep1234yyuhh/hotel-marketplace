import { NextResponse } from "next/server";
import { findHotelById, roomCategoriesForHotel, updateHotelPublished, deleteHotel } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const hotel = findHotelById(params.id);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  return NextResponse.json({
    hotel: { ...hotel, roomCategories: roomCategoriesForHotel(hotel.id) },
  });
}

// PATCH — publish/unpublish a listing (owner or super admin).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const hotel = findHotelById(params.id);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  if (hotel.ownerId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can only manage your own listings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.published !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = updateHotelPublished(params.id, body.published);
  return NextResponse.json({ hotel: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const hotel = findHotelById(params.id);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  if (hotel.ownerId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can only remove your own listings" },
      { status: 403 }
    );
  }

  deleteHotel(params.id);
  return NextResponse.json({ ok: true });
}
