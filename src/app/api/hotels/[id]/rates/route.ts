import { NextResponse } from "next/server";
import {
  findHotelById,
  roomCategoriesForHotel,
  listRateOverridesForHotel,
  upsertRateOverrides,
} from "@/lib/db";
import { getSession, canManageListing } from "@/lib/session";
import { upsertRateOverridesSchema } from "@/lib/validations";

// GET /api/hotels/[id]/rates — room categories + every stored rate/inventory
// override for this hotel. Owner, granted manager, or super admin only.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const hotel = await findHotelById(params.id);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  if (!(await canManageListing(hotel, session))) {
    return NextResponse.json(
      { error: "You can only manage rates for your own listings" },
      { status: 403 }
    );
  }

  const [roomCategories, overrides] = await Promise.all([
    roomCategoriesForHotel(params.id),
    listRateOverridesForHotel(params.id),
  ]);

  return NextResponse.json({ roomCategories, overrides });
}

// POST /api/hotels/[id]/rates — batch upsert rate/inventory overrides for
// a set of (roomCategoryId, date) cells. Same access as GET.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const hotel = await findHotelById(params.id);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  if (!(await canManageListing(hotel, session))) {
    return NextResponse.json(
      { error: "You can only manage rates for your own listings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertRateOverridesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const roomCategories = await roomCategoriesForHotel(params.id);
  const validCategoryIds = new Set(roomCategories.map((rc) => rc.id));
  const entries = parsed.data.entries.filter((e) => validCategoryIds.has(e.roomCategoryId));
  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid room categories in entries" }, { status: 400 });
  }

  await upsertRateOverrides(params.id, entries);
  return NextResponse.json({ ok: true, count: entries.length });
}
