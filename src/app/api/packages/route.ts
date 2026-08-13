import { NextResponse } from "next/server";
import { listTourPackages, itineraryForPackage, createTourPackage } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createTourPackageSchema } from "@/lib/validations";

// GET /api/packages?q=...&owner=me
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || undefined;
  const owner = searchParams.get("owner");
  const session = getSession();

  let packages;
  if (owner === "me") {
    if (!session) return NextResponse.json({ packages: [] });
    packages = await listTourPackages({ ownerId: session.userId, q });
  } else {
    packages = await listTourPackages({ published: true, q });
  }

  const withItinerary = await Promise.all(
    packages.map(async (p) => ({
      ...p,
      itinerary: await itineraryForPackage(p.id),
    }))
  );

  return NextResponse.json({ packages: withItinerary });
}

// POST /api/packages (sellers and admins only)
export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }
  if (session.role !== "SELLER" && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Switch to a host account to list a package" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createTourPackageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { itinerary, ...packageData } = parsed.data;

  const tourPackage = await createTourPackage(
    {
      ...packageData,
      published: true,
      ownerId: session.userId,
    },
    itinerary
  );

  return NextResponse.json({ package: tourPackage }, { status: 201 });
}
