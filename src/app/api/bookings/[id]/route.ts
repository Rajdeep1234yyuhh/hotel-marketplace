import { NextResponse } from "next/server";
import { findBookingById, findHotelById, updateBookingStatus } from "@/lib/db";
import { getSession, canManageListing } from "@/lib/session";

// PATCH /api/bookings/[id] — cancel a booking. Owner, granted manager, or
// super admin only (same access as managing the hotel it belongs to).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const booking = await findBookingById(params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const hotel = await findHotelById(booking.hotelId);
  if (!hotel || !(await canManageListing(hotel, session))) {
    return NextResponse.json(
      { error: "You can only manage bookings for your own listings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (body?.status !== "CANCELLED") {
    return NextResponse.json({ error: "Unsupported status change" }, { status: 400 });
  }

  const updated = await updateBookingStatus(params.id, "CANCELLED");
  return NextResponse.json({ booking: updated });
}
