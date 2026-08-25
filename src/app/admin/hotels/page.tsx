import Link from "next/link";
import { listHotels, roomCategoriesForHotel, bookingCountsByHotel, findUserById } from "@/lib/db";
import { DeleteHotelButton } from "@/components/DeleteHotelButton";
import { PublishToggleButton } from "@/components/PublishToggleButton";
import { ManagersEditor } from "@/components/ManagersEditor";

export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const [bookingCounts, allHotels] = await Promise.all([
    bookingCountsByHotel(),
    listHotels(),
  ]);

  const hotels = await Promise.all(
    allHotels.map(async (h) => {
      const owner = await findUserById(h.ownerId);
      return {
        ...h,
        owner: { name: owner?.name ?? "Unknown", email: owner?.email ?? "—" },
        roomCategories: await roomCategoriesForHotel(h.id),
        _count: { bookings: bookingCounts[h.id] ?? 0 },
      };
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink">Hotels</h2>
        <Link
          href="/admin/hotels/new"
          className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-deep"
        >
          + Add hotel
        </Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Hotelier</th>
              <th className="px-4 py-3 font-medium">Rooms</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {hotels.map((h) => {
              const rooms = h.roomCategories.reduce((s, rc) => s + rc.totalRooms, 0);
              return (
                <tr key={h.id} className="transition hover:bg-paper/50">
                  <td className="px-4 py-4">
                    <Link
                      href={`/hotels/${h.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {h.name}
                    </Link>
                    <p className="text-xs text-slate">
                      {h.city}, {h.country}
                    </p>
                    <details className="mt-1 text-xs text-slate [&_summary]:cursor-pointer">
                      <summary className="font-medium text-accent-deep hover:underline">
                        Payout details
                      </summary>
                      <div className="mt-1 space-y-0.5 rounded-md border border-line bg-paper/50 p-2">
                        <p>{h.bankAccountHolder || "—"}</p>
                        <p>
                          {h.bankName || "—"} · {h.bankAccountNumber || "—"} ·{" "}
                          {h.bankIfsc || "—"}
                        </p>
                        <p>
                          {h.contactEmail || "—"} · {h.contactPhone || "—"}
                        </p>
                      </div>
                    </details>
                    <details className="mt-1 text-xs text-slate [&_summary]:cursor-pointer">
                      <summary className="font-medium text-accent-deep hover:underline">
                        Manager access ({(h.managerEmails ?? []).length})
                      </summary>
                      <div className="mt-1 w-64 rounded-md border border-line bg-paper/50 p-2">
                        <ManagersEditor
                          apiPath={`/api/admin/hotels/${h.id}/managers`}
                          managerEmails={h.managerEmails ?? []}
                        />
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-4 text-slate">
                    <p className="text-ink">{h.owner.name}</p>
                    <p className="text-xs">{h.owner.email}</p>
                  </td>
                  <td className="px-4 py-4 text-ink">{rooms}</td>
                  <td className="px-4 py-4 text-ink">{h._count.bookings}</td>
                  <td className="px-4 py-4">
                    <PublishToggleButton hotelId={h.id} published={h.published} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/hotels/${h.id}/edit`}
                        className="text-xs font-medium text-slate transition hover:text-ink"
                      >
                        Edit
                      </Link>
                      <DeleteHotelButton hotelId={h.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {hotels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate">
                  No listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
