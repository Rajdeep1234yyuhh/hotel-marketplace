import { NextResponse } from "next/server";
import {
  findHotelById,
  findRoomCategoryById,
  findUserByEmail,
  createUser,
  createBooking,
} from "@/lib/db";
import { createBookingSchema, nightsBetween } from "@/lib/validations";

// POST /api/bookings — booking never requires a session. Anyone can browse
// and book; the guest name/email collected on this form is all that's
// needed. A lightweight BUYER user record is created (or reused) purely to
// satisfy the booking's guestId reference — no cookie is set, so the
// browser stays signed out the whole time.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { hotelId, guestName, email, checkIn, checkOut, guests, mealPlan, roomCategoryId } =
    parsed.data;

  const hotel = await findHotelById(hotelId);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  // Always price on the server — never trust a client-supplied total.
  const category = await findRoomCategoryById(roomCategoryId);
  if (!category || category.hotelId !== hotelId) {
    return NextResponse.json(
      { error: "Selected room category is invalid" },
      { status: 400 }
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * category.pricePerNight;

  // Reuse an existing account if this email already has one (keeping
  // whatever role it already has — never downgrade a SELLER/ADMIN just
  // because they booked with their own email). Otherwise create a fresh,
  // session-less BUYER record purely to satisfy the guestId reference.
  const existingGuest = await findUserByEmail(email);
  const guestId = existingGuest
    ? existingGuest.id
    : (await createUser({ name: guestName, email, role: "BUYER" })).id;

  const booking = await createBooking({
    hotelId,
    guestId,
    guestName,
    email,
    checkIn: new Date(checkIn).toISOString(),
    checkOut: new Date(checkOut).toISOString(),
    guests,
    nights,
    total,
    mealPlan,
    roomCategoryId: category.id,
  });

  return NextResponse.json({ booking, hotelName: hotel.name }, { status: 201 });
}
