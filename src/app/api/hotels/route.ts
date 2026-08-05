import { NextResponse } from "next/server";
import { listHotels, roomCategoriesForHotel, createHotel } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createHotelSchema } from "@/lib/validations";

// GET /api/hotels?q=...&owner=me
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || undefined;
  const owner = searchParams.get("owner");
  const session = getSession();

  let hotels;
  if (owner === "me") {
    if (!session) return NextResponse.json({ hotels: [] });
    hotels = await listHotels({ ownerId: session.userId, q });
  } else {
    hotels = await listHotels({ published: true, q });
  }

  const withCategories = await Promise.all(
    hotels.map(async (h) => ({
      ...h,
      roomCategories: await roomCategoriesForHotel(h.id),
    }))
  );

  return NextResponse.json({ hotels: withCategories });
}

// POST /api/hotels  (sellers only)
export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }
  if (session.role !== "SELLER" && session.role !== "ADMIN") {
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

  const { roomCategories, latitude, longitude, ...hotelData } = parsed.data;

  const hotel = await createHotel(
    {
      ...hotelData,
      rating: 0,
      published: true,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      ownerId: session.userId,
    },
    roomCategories
  );

  return NextResponse.json({ hotel }, { status: 201 });
}
