import Link from "next/link";
import { Suspense } from "react";
import {
  listHotels,
  listBookings,
  roomCategoriesForHotel,
  findUserById,
} from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatMoney } from "@/lib/validations";
import { BookingsFilters } from "@/components/BookingsFilters";
import { CancelBookingButton } from "@/components/CancelBookingButton";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { EditableReference } from "@/components/EditableReference";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

type DisplayStatus = "UPCOMING" | "IN_HOUSE" | "CHECKED_OUT" | "CANCELLED";

function deriveStatus(
  status: string,
  checkIn: string,
  checkOut: string,
  now: Date
): DisplayStatus {
  if (status === "CANCELLED") return "CANCELLED";
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (now < ci) return "UPCOMING";
  if (now <= co) return "IN_HOUSE";
  return "CHECKED_OUT";
}

const STATUS_LABEL: Record<DisplayStatus, string> = {
  UPCOMING: "Upcoming",
  IN_HOUSE: "In House",
  CHECKED_OUT: "Checked Out",
  CANCELLED: "Cancelled",
};

const STATUS_STYLE: Record<DisplayStatus, string> = {
  UPCOMING: "bg-accent/10 text-accent-deep",
  IN_HOUSE: "bg-amber-50 text-amber-700",
  CHECKED_OUT: "bg-line text-slate",
  CANCELLED: "bg-red-50 text-red-600",
};

export default async function SellerBookingsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    hotelId?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}) {
  const session = getSession();
  if (!session) return null;

  const currentUser = await findUserById(session.userId);
  const [ownedHotels, managedHotels] = await Promise.all([
    listHotels({ ownerId: session.userId }),
    currentUser
      ? listHotels({ managerEmail: currentUser.email.trim().toLowerCase() })
      : Promise.resolve([]),
  ]);
  const hotelsById = new Map([...ownedHotels, ...managedHotels].map((h) => [h.id, h]));
  const hotels = Array.from(hotelsById.values());
  const hotelIdSet = new Set(hotels.map((h) => h.id));

  const roomCategoriesByHotel = await Promise.all(
    hotels.map((h) => roomCategoriesForHotel(h.id))
  );
  const roomCategoryById = new Map(roomCategoriesByHotel.flat().map((rc) => [rc.id, rc]));

  const allBookings = await listBookings();
  const now = new Date();

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const statusFilter = searchParams.status;
  const hotelIdFilter = searchParams.hotelId;
  const fromFilter = searchParams.from ? new Date(searchParams.from) : null;
  const toFilter = searchParams.to ? new Date(searchParams.to) : null;

  let rows = allBookings
    .filter((b) => hotelIdSet.has(b.hotelId))
    .map((b) => ({
      ...b,
      hotelName: hotelsById.get(b.hotelId)?.name ?? "Deleted listing",
      roomTypeName:
        (b.roomCategoryId && roomCategoryById.get(b.roomCategoryId)?.name) || "—",
      displayStatus: deriveStatus(b.status, b.checkIn, b.checkOut, now),
    }));

  if (hotelIdFilter) rows = rows.filter((b) => b.hotelId === hotelIdFilter);
  if (statusFilter) rows = rows.filter((b) => b.displayStatus === statusFilter);
  if (fromFilter) rows = rows.filter((b) => new Date(b.checkIn) >= fromFilter);
  if (toFilter) rows = rows.filter((b) => new Date(b.checkIn) <= toFilter);
  if (q) {
    rows = rows.filter(
      (b) =>
        b.reference?.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalReservations = rows.length;
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingArrivals = rows.filter(
    (b) =>
      b.displayStatus !== "CANCELLED" &&
      new Date(b.checkIn) >= now &&
      new Date(b.checkIn) <= in7Days
  ).length;
  const inHouseGuests = rows
    .filter((b) => b.displayStatus === "IN_HOUSE")
    .reduce((sum, b) => sum + b.guests, 0);
  const activeRows = rows.filter((b) => b.displayStatus !== "CANCELLED");
  const totalRevenue = activeRows.reduce((sum, b) => sum + b.total, 0);
  const totalNights = activeRows.reduce((sum, b) => sum + b.nights, 0);
  const averageDailyRate = totalNights > 0 ? totalRevenue / totalNights : 0;

  const page = Math.max(1, Number(searchParams.page) || 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (searchParams.status) sp.set("status", searchParams.status);
    if (searchParams.hotelId) sp.set("hotelId", searchParams.hotelId);
    if (searchParams.from) sp.set("from", searchParams.from);
    if (searchParams.to) sp.set("to", searchParams.to);
    sp.set("page", String(p));
    return `/seller/bookings?${sp.toString()}`;
  }

  const exportRows = rows.map((b) => ({
    Reference: b.reference ?? "",
    Property: b.hotelName,
    Guest: b.guestName,
    Email: b.email,
    RoomType: b.roomTypeName,
    CheckIn: b.checkIn.slice(0, 10),
    CheckOut: b.checkOut.slice(0, 10),
    Guests: b.guests,
    Amount: b.total,
    Status: STATUS_LABEL[b.displayStatus],
  }));

  const columnCount = hotels.length > 1 ? 9 : 8;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink">Bookings</h2>
        <ExportCsvButton rows={exportRows} filename="bookings.csv" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total Reservations" value={totalReservations} hint="Matching filters" />
        <StatCard label="Upcoming Arrivals" value={upcomingArrivals} hint="Next 7 days" />
        <StatCard label="In House Guests" value={inHouseGuests} hint="Currently staying" />
        <StatCard
          label="Total Revenue"
          value={formatMoney(totalRevenue)}
          hint="Matching filters"
        />
        <StatCard
          label="Average Daily Rate"
          value={formatMoney(Math.round(averageDailyRate))}
          hint="Matching filters"
        />
      </div>

      <div className="mt-6">
        <Suspense>
          <BookingsFilters properties={hotels.map((h) => ({ id: h.id, name: h.name }))} />
        </Suspense>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              {hotels.length > 1 && <th className="px-4 py-3 font-medium">Property</th>}
              <th className="px-4 py-3 font-medium">Room Type</th>
              <th className="px-4 py-3 font-medium">Check-in / Check-out</th>
              <th className="px-4 py-3 font-medium">Guests</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pageRows.map((b) => (
              <tr key={b.id} className="transition hover:bg-paper/50">
                <td className="px-4 py-4">
                  <EditableReference reference={b.reference ?? ""} apiPath={`/api/bookings/${b.id}`} />
                </td>
                <td className="px-4 py-4 text-slate">
                  <p className="text-ink">{b.guestName}</p>
                  <p className="text-xs">{b.email}</p>
                </td>
                {hotels.length > 1 && (
                  <td className="px-4 py-4 text-slate">{b.hotelName}</td>
                )}
                <td className="px-4 py-4 text-ink">{b.roomTypeName}</td>
                <td className="px-4 py-4 text-xs text-slate">
                  {new Date(b.checkIn).toLocaleDateString()} →{" "}
                  {new Date(b.checkOut).toLocaleDateString()}
                  <br />
                  {b.nights} {b.nights === 1 ? "night" : "nights"}
                </td>
                <td className="px-4 py-4 text-ink">{b.guests}</td>
                <td className="px-4 py-4 text-ink">{formatMoney(b.total)}</td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[b.displayStatus]}`}
                  >
                    {STATUS_LABEL[b.displayStatus]}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  {b.displayStatus === "UPCOMING" || b.displayStatus === "IN_HOUSE" ? (
                    <CancelBookingButton bookingId={b.id} />
                  ) : (
                    <span className="text-xs text-slate">—</span>
                  )}
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-8 text-center text-slate"
                >
                  No bookings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length} entries
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <PageLink href={pageHref(Math.max(1, page - 1))} disabled={page === 1}>
                ‹
              </PageLink>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PageLink key={i} href={pageHref(i + 1)} active={i + 1 === page}>
                  {i + 1}
                </PageLink>
              ))}
              <PageLink
                href={pageHref(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                ›
              </PageLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-slate">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-slate">{hint}</p>
    </div>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-lg px-3 py-1.5 text-sm text-slate/40">{children}</span>
    );
  }
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-ink text-paper" : "text-slate hover:bg-paper hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
