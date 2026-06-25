import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createHotelSchema } from "@/lib/validations";

// GET /api/hotels?q=...&owner=me
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const owner = searchParams.get("owner");
  const session = getSession();

  const where: Record<string, unknown> = {};

  if (owner === "me") {
    if (!session) return NextResponse.json({ hotels: [] });
    where.ownerId = session.userId;
  } else {
    where.published = true;
  }

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { city: { contains: q } },
      { country: { contains: q } },
    ];
  }

  const hotels = await prisma.hotel.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ hotels });
}

// POST /api/hotels  (sellers only)
export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }
  if (session.role !== "SELLER") {
    return NextResponse.json(
      { error: "Switch to a host account to list a property" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createHotelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const hotel = await prisma.hotel.create({
    data: { ...parsed.data, ownerId: session.userId },
  });

  return NextResponse.json({ hotel }, { status: 201 });
}
