import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DeleteHotelButton } from "@/components/DeleteHotelButton";
import { formatMoney } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function SellerDashboard() {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "SELLER") redirect("/browse");

  const hotels = await prisma.hotel.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  const totalBookings = hotels.reduce((sum, h) => sum + h._count.bookings, 0);

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Host dashboard</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">
            Your properties
          </h1>
          <p className="mt-2 text-slate">
            {hotels.length} {hotels.length === 1 ? "listing" : "listings"} ·{" "}
            {totalBookings} {totalBookings === 1 ? "booking" : "bookings"} received.
          </p>
        </div>
        <Link
          href="/seller/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90"
        >
          + Add a property
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl text-ink">No listings yet</p>
          <p className="mt-2 text-slate">
            Add your first property and it goes live in the marketplace instantly.
          </p>
          <Link
            href="/seller/new"
            className="mt-6 inline-block rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass-deep hover:text-paper"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Location</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Bookings</th>
                <th className="px-4 py-3 text-right font-medium">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {hotels.map((h) => (
                <tr key={h.id} className="transition hover:bg-paper/50">
                  <td className="px-4 py-4">
                    <Link
                      href={`/hotels/${h.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {h.name}
                    </Link>
                    <p className="text-xs text-slate sm:hidden">
                      {h.city}, {h.country}
                    </p>
                  </td>
                  <td className="hidden px-4 py-4 text-slate sm:table-cell">
                    {h.city}, {h.country}
                  </td>
                  <td className="px-4 py-4 text-ink">
                    {formatMoney(h.pricePerNight, h.currency)}
                    <span className="text-slate"> / night</span>
                  </td>
                  <td className="hidden px-4 py-4 text-ink md:table-cell">
                    {h._count.bookings}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <DeleteHotelButton hotelId={h.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
