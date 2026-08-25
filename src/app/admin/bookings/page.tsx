import Link from "next/link";
import { listHotels, listTourPackages, listBookings, listPackageBookings } from "@/lib/db";
import { formatMoney } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const [hotels, packages, allBookings, allPackageBookings] = await Promise.all([
    listHotels(),
    listTourPackages(),
    listBookings(),
    listPackageBookings(),
  ]);

  const hotelById = new Map(hotels.map((h) => [h.id, h]));
  const packageById = new Map(packages.map((p) => [p.id, p]));

  const bookingRows = [
    ...allBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      kind: "Hotel stay" as const,
      listingName: hotelById.get(b.hotelId)?.name ?? "Deleted listing",
      listingHref: `/hotels/${b.hotelId}`,
      guestName: b.guestName,
      email: b.email,
      details: `${new Date(b.checkIn).toLocaleDateString()} → ${new Date(
        b.checkOut
      ).toLocaleDateString()} · ${b.nights} ${b.nights === 1 ? "night" : "nights"} · ${
        b.guests
      } ${b.guests === 1 ? "guest" : "guests"} · ${b.mealPlan}`,
      total: b.total,
      status: b.status,
      createdAt: b.createdAt,
    })),
    ...allPackageBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      kind: "Tour package" as const,
      listingName: packageById.get(b.packageId)?.title ?? "Deleted listing",
      listingHref: `/packages/${b.packageId}`,
      guestName: b.guestName,
      email: b.email,
      details: `${new Date(b.travelDate).toLocaleDateString()} · ${b.travelers} ${
        b.travelers === 1 ? "traveller" : "travellers"
      }`,
      total: b.total,
      status: b.status,
      createdAt: b.createdAt,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink">Bookings</h2>
      <p className="mt-1 text-sm text-slate">
        Every hotel stay and tour package booking across the marketplace.
      </p>
      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Booked on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookingRows.map((b) => (
              <tr key={`${b.kind}-${b.id}`} className="transition hover:bg-paper/50">
                <td className="px-4 py-4 font-mono text-xs font-medium text-ink">
                  {b.reference || "—"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.kind === "Hotel stay"
                        ? "bg-accent/10 text-accent-deep"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {b.kind}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Link href={b.listingHref} className="font-medium text-ink hover:underline">
                    {b.listingName}
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate">
                  <p className="text-ink">{b.guestName}</p>
                  <p className="text-xs">{b.email}</p>
                </td>
                <td className="px-4 py-4 text-xs text-slate">{b.details}</td>
                <td className="px-4 py-4 text-ink">{formatMoney(b.total)}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {bookingRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate">
                  No bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
