import Link from "next/link";
import { Suspense } from "react";
import { listHotels, listTourPackages, listBookings, listPackageBookings } from "@/lib/db";
import { formatMoney } from "@/lib/validations";
import { AdminBookingsFilters } from "@/components/AdminBookingsFilters";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { EditableReference } from "@/components/EditableReference";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; status?: string; from?: string; to?: string; page?: string };
}) {
  const [hotels, packages, allBookings, allPackageBookings] = await Promise.all([
    listHotels(),
    listTourPackages(),
    listBookings(),
    listPackageBookings(),
  ]);

  const hotelById = new Map(hotels.map((h) => [h.id, h]));
  const packageById = new Map(packages.map((p) => [p.id, p]));

  let bookingRows = [
    ...allBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      kind: "Hotel stay" as const,
      typeParam: "hotel",
      listingName: hotelById.get(b.hotelId)?.name ?? "Deleted listing",
      listingHref: `/hotels/${b.hotelId}`,
      guestName: b.guestName,
      email: b.email,
      details: `${new Date(b.checkIn).toLocaleDateString()} → ${new Date(
        b.checkOut
      ).toLocaleDateString()} · ${b.nights} ${b.nights === 1 ? "night" : "nights"} · ${
        b.guests
      } ${b.guests === 1 ? "guest" : "guests"} · ${b.mealPlan}`,
      eventDate: b.checkIn.slice(0, 10),
      total: b.total,
      status: b.status,
      createdAt: b.createdAt,
    })),
    ...allPackageBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      kind: "Tour package" as const,
      typeParam: "package",
      listingName: packageById.get(b.packageId)?.title ?? "Deleted listing",
      listingHref: `/packages/${b.packageId}`,
      guestName: b.guestName,
      email: b.email,
      details: `${new Date(b.travelDate).toLocaleDateString()} · ${b.travelers} ${
        b.travelers === 1 ? "traveller" : "travellers"
      }`,
      eventDate: b.travelDate.slice(0, 10),
      total: b.total,
      status: b.status,
      createdAt: b.createdAt,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const typeFilter = searchParams.type;
  const statusFilter = searchParams.status;
  const fromFilter = searchParams.from;
  const toFilter = searchParams.to;

  if (typeFilter) bookingRows = bookingRows.filter((b) => b.typeParam === typeFilter);
  if (statusFilter) bookingRows = bookingRows.filter((b) => b.status === statusFilter);
  if (fromFilter) bookingRows = bookingRows.filter((b) => b.eventDate >= fromFilter);
  if (toFilter) bookingRows = bookingRows.filter((b) => b.eventDate <= toFilter);
  if (q) {
    bookingRows = bookingRows.filter(
      (b) =>
        b.reference?.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.listingName.toLowerCase().includes(q)
    );
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const totalPages = Math.max(1, Math.ceil(bookingRows.length / PAGE_SIZE));
  const pageRows = bookingRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (searchParams.type) sp.set("type", searchParams.type);
    if (searchParams.status) sp.set("status", searchParams.status);
    if (searchParams.from) sp.set("from", searchParams.from);
    if (searchParams.to) sp.set("to", searchParams.to);
    sp.set("page", String(p));
    return `/admin/bookings?${sp.toString()}`;
  }

  const exportRows = bookingRows.map((b) => ({
    Reference: b.reference ?? "",
    Type: b.kind,
    Listing: b.listingName,
    Guest: b.guestName,
    Email: b.email,
    Details: b.details,
    Total: b.total,
    Status: b.status,
    BookedOn: b.createdAt.slice(0, 10),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink">Bookings</h2>
        <ExportCsvButton rows={exportRows} filename="all-bookings.csv" />
      </div>
      <p className="mt-1 text-sm text-slate">
        Every hotel stay and tour package booking across the marketplace.
      </p>

      <div className="mt-4">
        <Suspense>
          <AdminBookingsFilters />
        </Suspense>
      </div>

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
            {pageRows.map((b) => (
              <tr key={`${b.kind}-${b.id}`} className="transition hover:bg-paper/50">
                <td className="px-4 py-4">
                  <EditableReference
                    reference={b.reference ?? ""}
                    apiPath={
                      b.typeParam === "hotel"
                        ? `/api/bookings/${b.id}`
                        : `/api/package-bookings/${b.id}`
                    }
                  />
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
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === "CANCELLED"
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate">
                  No bookings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {bookingRows.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, bookingRows.length)} of {bookingRows.length} entries
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
    return <span className="rounded-lg px-3 py-1.5 text-sm text-slate/40">{children}</span>;
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
