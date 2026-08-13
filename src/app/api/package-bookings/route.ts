import { NextResponse } from "next/server";
import {
  findTourPackageById,
  findUserByEmail,
  createUser,
  createPackageBooking,
} from "@/lib/db";
import { createPackageBookingSchema } from "@/lib/validations";

// POST /api/package-bookings — same session-less pattern as /api/bookings:
// anyone can book a tour package without signing in.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createPackageBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { packageId, guestName, email, travelDate, travelers } = parsed.data;

  const tourPackage = await findTourPackageById(packageId);
  if (!tourPackage) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  // Always price on the server — never trust a client-supplied total.
  const total = travelers * tourPackage.pricePerPerson;

  const existingGuest = await findUserByEmail(email);
  const guestId = existingGuest
    ? existingGuest.id
    : (await createUser({ name: guestName, email, role: "BUYER" })).id;

  const booking = await createPackageBooking({
    packageId,
    guestId,
    guestName,
    email,
    travelDate: new Date(travelDate).toISOString(),
    travelers,
    total,
  });

  return NextResponse.json({ booking, packageTitle: tourPackage.title }, { status: 201 });
}
