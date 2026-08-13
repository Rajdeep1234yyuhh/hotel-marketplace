import { NextResponse } from "next/server";
import {
  findTourPackageById,
  itineraryForPackage,
  updateTourPackagePublished,
  updateTourPackage,
  deleteTourPackage,
} from "@/lib/db";
import { getSession } from "@/lib/session";
import { updateTourPackageSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const tourPackage = await findTourPackageById(params.id);
  if (!tourPackage) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  return NextResponse.json({
    package: { ...tourPackage, itinerary: await itineraryForPackage(tourPackage.id) },
  });
}

// PATCH — publish/unpublish, or quick-edit fields (owner or super admin).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const tourPackage = await findTourPackageById(params.id);
  if (!tourPackage) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  if (tourPackage.ownerId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can only manage your own listings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);

  if (typeof body?.published === "boolean") {
    const updated = await updateTourPackagePublished(params.id, body.published);
    return NextResponse.json({ package: updated });
  }

  const parsed = updateTourPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await updateTourPackage(params.id, parsed.data);
  return NextResponse.json({ package: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const tourPackage = await findTourPackageById(params.id);
  if (!tourPackage) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  if (tourPackage.ownerId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can only remove your own listings" },
      { status: 403 }
    );
  }

  await deleteTourPackage(params.id);
  return NextResponse.json({ ok: true });
}
