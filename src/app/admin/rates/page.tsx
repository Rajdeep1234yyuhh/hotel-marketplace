import { listHotels, roomCategoriesForHotel, listRateOverridesForHotel } from "@/lib/db";
import { formatMoney } from "@/lib/validations";
import { PropertySelect } from "@/components/PropertySelect";
import { RatesGrid } from "@/components/RatesGrid";

export const dynamic = "force-dynamic";

// Local-date getters, not toISOString() (UTC) — see CalendarRangePicker.tsx
// for why mixing the two silently breaks date-range math in IST.
function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export default async function AdminRatesPage({
  searchParams,
}: {
  searchParams: { hotelId?: string };
}) {
  const hotels = await listHotels();

  if (hotels.length === 0) {
    return (
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Rates & Inventories</h2>
        <div className="mt-4 rounded-card border border-line bg-white p-6 text-center text-sm text-slate">
          No hotels in the marketplace yet.
        </div>
      </div>
    );
  }

  const selectedHotel = hotels.find((h) => h.id === searchParams.hotelId) ?? hotels[0];

  const [roomCategories, overrides] = await Promise.all([
    roomCategoriesForHotel(selectedHotel.id),
    listRateOverridesForHotel(selectedHotel.id),
  ]);

  const overrideMap = new Map(overrides.map((o) => [`${o.roomCategoryId}|${o.date}`, o]));

  const today = toISODate(new Date());
  const windowDates = Array.from({ length: 8 }, (_, i) => addDays(today, i));

  let totalInventory = 0;
  let totalValue = 0;
  let rateSum = 0;
  let rateCount = 0;

  for (const rc of roomCategories) {
    for (const date of windowDates) {
      const o = overrideMap.get(`${rc.id}|${date}`);
      const rate = o?.rate ?? rc.pricePerNight;
      const available = o?.closed ? 0 : o?.availableRooms ?? rc.totalRooms;
      totalInventory += available;
      totalValue += rate * available;
      rateSum += rate;
      rateCount += 1;
    }
  }

  const totalRooms = roomCategories.reduce((sum, rc) => sum + rc.totalRooms, 0);
  const averageRate = rateCount > 0 ? rateSum / rateCount : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-ink">Rates & Inventories</h2>
        <PropertySelect
          hotels={hotels.map((h) => ({ id: h.id, name: h.name }))}
          selectedId={selectedHotel.id}
          basePath="/admin/rates"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Rooms"
          value={totalRooms}
          hint={`Across ${roomCategories.length} room type${roomCategories.length === 1 ? "" : "s"}`}
        />
        <StatCard label="Total Inventory" value={totalInventory} hint="Next 8 days" />
        <StatCard label="Average Rate" value={formatMoney(Math.round(averageRate))} hint="Next 8 days" />
        <StatCard label="Total Value" value={formatMoney(totalValue)} hint="Next 8 days" />
      </div>

      <div className="mt-6">
        <RatesGrid
          hotelId={selectedHotel.id}
          roomCategories={roomCategories.map((rc) => ({
            id: rc.id,
            name: rc.name,
            pricePerNight: rc.pricePerNight,
            totalRooms: rc.totalRooms,
          }))}
          initialOverrides={overrides.map((o) => ({
            roomCategoryId: o.roomCategoryId,
            date: o.date,
            rate: o.rate,
            availableRooms: o.availableRooms,
            closed: o.closed,
            minStay: o.minStay,
            maxStay: o.maxStay,
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-slate">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-slate">{hint}</p>
    </div>
  );
}
