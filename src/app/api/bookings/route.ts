import { NextResponse } from "next/server";
import { findHotelById, findRoomCategoryById, createBooking } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createBookingSchema, nightsBetween } from "@/lib/validations";

// POST /api/bookings
export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in as a traveller to book" },
      { status: 401 }
    );
  }

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

  const hotel = findHotelById(hotelId);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  // Always price on the server — never trust a client-supplied total.
  let nightlyRate = hotel.pricePerNight;
  let resolvedRoomCategoryId: string | null = null;

  if (roomCategoryId) {
    const category = findRoomCategoryById(roomCategoryId);
    if (!category || category.hotelId !== hotelId) {
      return NextResponse.json(
        { error: "Selected room category is invalid" },
        { status: 400 }
      );
    }
    nightlyRate = category.pricePerNight;
    resolvedRoomCategoryId = category.id;
  }

  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * nightlyRate;

  const booking = createBooking({
    hotelId,
    guestId: session.userId,
    guestName,
    email,
    checkIn: new Date(checkIn).toISOString(),
    checkOut: new Date(checkOut).toISOString(),
    guests,
    nights,
    total,
    mealPlan,
    roomCategoryId: resolvedRoomCategoryId,
  });

  return NextResponse.json({ booking, hotelName: hotel.name }, { status: 201 });
}
