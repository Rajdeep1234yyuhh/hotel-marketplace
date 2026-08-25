import { NextResponse } from "next/server";
import {
  findPackageBookingById,
  findTourPackageById,
  updatePackageBookingReference,
  isBookingReferenceTaken,
} from "@/lib/db";
import { getSession, canManageListing } from "@/lib/session";
import { updateBookingReferenceSchema } from "@/lib/validations";

// PATCH /api/package-bookings/[id] — edit a package booking's reference.
// Owner, granted manager, or super admin only (same access as managing the
// package it belongs to).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const booking = await findPackageBookingById(params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const tourPackage = await findTourPackageById(booking.packageId);
  if (!tourPackage || !(await canManageListing(tourPackage, session))) {
    return NextResponse.json(
      { error: "You can only manage bookings for your own listings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateBookingReferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const taken = await isBookingReferenceTaken(parsed.data.reference, {
    packageBookingId: params.id,
  });
  if (taken) {
    return NextResponse.json(
      { error: { reference: ["This reference is already in use"] } },
      { status: 409 }
    );
  }

  const updated = await updatePackageBookingReference(params.id, parsed.data.reference);
  return NextResponse.json({ booking: updated });
}
