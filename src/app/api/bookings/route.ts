import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const { hotelId, guestName, email, checkIn, checkOut, guests } = parsed.data;

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  // Always price on the server — never trust a client-supplied total.
  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * hotel.pricePerNight;

  const booking = await prisma.booking.create({
    data: {
      hotelId,
      guestId: session.userId,
      guestName,
      email,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      nights,
      total,
    },
  });

  return NextResponse.json({ booking, hotelName: hotel.name }, { status: 201 });
}
