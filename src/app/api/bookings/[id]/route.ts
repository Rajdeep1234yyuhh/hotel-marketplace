import { NextResponse } from "next/server";
import {
  findBookingById,
  findHotelById,
  updateBookingStatus,
  updateBookingReference,
  isBookingReferenceTaken,
} from "@/lib/db";
import { getSession, canManageListing } from "@/lib/session";
import { updateBookingReferenceSchema } from "@/lib/validations";

// PATCH /api/bookings/[id] — cancel a booking, or edit its reference.
// Owner, granted manager, or super admin only (same access as managing the
// hotel it belongs to).
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

  if (body?.status === "CANCELLED") {
    const updated = await updateBookingStatus(params.id, "CANCELLED");
    return NextResponse.json({ booking: updated });
  }

  if (typeof body?.reference === "string") {
    const parsed = updateBookingReferenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const taken = await isBookingReferenceTaken(parsed.data.reference, {
      bookingId: params.id,
    });
    if (taken) {
      return NextResponse.json(
        { error: { reference: ["This reference is already in use"] } },
        { status: 409 }
      );
    }

    const updated = await updateBookingReference(params.id, parsed.data.reference);
    return NextResponse.json({ booking: updated });
  }

  return NextResponse.json({ error: "Unsupported update" }, { status: 400 });
}
