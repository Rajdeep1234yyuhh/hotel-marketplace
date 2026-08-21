import Link from "next/link";
import { redirect } from "next/navigation";
import {
  listHotels,
  roomCategoriesForHotel,
  bookingCountsByHotel,
  listUsers,
  countBookings,
  findUserById,
  listTourPackages,
  packageBookingCountsByPackage,
  countPackageBookings,
  listBookings,
  listPackageBookings,
} from "@/lib/db";
import { getSession } from "@/lib/session";
import { DeleteHotelButton } from "@/components/DeleteHotelButton";
import { PublishToggleButton } from "@/components/PublishToggleButton";
import { DeletePackageButton } from "@/components/DeletePackageButton";
import { PublishTogglePackageButton } from "@/components/PublishTogglePackageButton";
import { AddUserForm } from "@/components/AddUserForm";
import { ManagersEditor } from "@/components/ManagersEditor";
import { UserRoleSelect } from "@/components/UserRoleSelect";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { isFixedSuperAdmin } from "@/lib/super-admins";
import { formatMoney } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "ADMIN") redirect("/browse");

  const [
    bookingCounts,
    users,
    bookingsCount,
    allHotels,
    packageBookingCounts,
    packageBookingsCount,
    allPackages,
    allBookings,
    allPackageBookings,
  ] = await Promise.all([
    bookingCountsByHotel(),
    listUsers(),
    countBookings(),
    listHotels(),
    packageBookingCountsByPackage(),
    countPackageBookings(),
    listTourPackages(),
    listBookings(),
    listPackageBookings(),
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

  const packages = await Promise.all(
    allPackages.map(async (p) => {
      const owner = await findUserById(p.ownerId);
      return {
        ...p,
        owner: { name: owner?.name ?? "Unknown", email: owner?.email ?? "—" },
        _count: { bookings: packageBookingCounts[p.id] ?? 0 },
      };
    })
  );

  const publishedCount = hotels.filter((h) => h.published).length;
  const publishedPackageCount = packages.filter((p) => p.published).length;

  const hotelById = new Map(hotels.map((h) => [h.id, h]));
  const packageById = new Map(packages.map((p) => [p.id, p]));

  const bookingRows = [
    ...allBookings.map((b) => ({
      id: b.id,
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
    <div className="container-page py-10">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">Super admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Marketplace overview
        </h1>
        <p className="mt-2 text-slate">
          Every hotelier, listing, and booking across the marketplace.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Hotels" value={hotels.length} />
        <StatCard label="Published" value={publishedCount} />
        <StatCard label="Users" value={users.length} />
        <StatCard label="Bookings" value={bookingsCount} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Tour packages" value={packages.length} />
        <StatCard label="Packages published" value={publishedPackageCount} />
        <StatCard label="Package bookings" value={packageBookingsCount} />
      </div>

      <div className="mt-10">
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

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Tour Packages</h2>
          <Link
            href="/admin/packages/new"
            className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-deep"
          >
            + Add package
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Host</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Bookings</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {packages.map((p) => (
                <tr key={p.id} className="transition hover:bg-paper/50">
                  <td className="px-4 py-4">
                    <Link
                      href={`/packages/${p.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate">{p.destination}</p>
                    <details className="mt-1 text-xs text-slate [&_summary]:cursor-pointer">
                      <summary className="font-medium text-accent-deep hover:underline">
                        Payout details
                      </summary>
                      <div className="mt-1 space-y-0.5 rounded-md border border-line bg-paper/50 p-2">
                        <p>{p.bankAccountHolder || "—"}</p>
                        <p>
                          {p.bankName || "—"} · {p.bankAccountNumber || "—"} ·{" "}
                          {p.bankIfsc || "—"}
                        </p>
                        <p>
                          {p.contactEmail || "—"} · {p.contactPhone || "—"}
                        </p>
                      </div>
                    </details>
                    <details className="mt-1 text-xs text-slate [&_summary]:cursor-pointer">
                      <summary className="font-medium text-accent-deep hover:underline">
                        Manager access ({(p.managerEmails ?? []).length})
                      </summary>
                      <div className="mt-1 w-64 rounded-md border border-line bg-paper/50 p-2">
                        <ManagersEditor
                          apiPath={`/api/admin/packages/${p.id}/managers`}
                          managerEmails={p.managerEmails ?? []}
                        />
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-4 text-slate">
                    <p className="text-ink">{p.owner.name}</p>
                    <p className="text-xs">{p.owner.email}</p>
                  </td>
                  <td className="px-4 py-4 text-ink">
                    {p.durationDays}D / {p.durationNights}N
                  </td>
                  <td className="px-4 py-4 text-ink">{p._count.bookings}</td>
                  <td className="px-4 py-4">
                    <PublishTogglePackageButton packageId={p.id} published={p.published} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/packages/${p.id}/edit`}
                        className="text-xs font-medium text-slate transition hover:text-ink"
                      >
                        Edit
                      </Link>
                      <DeletePackageButton packageId={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate">
                    No packages yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold text-ink">Bookings</h2>
        <p className="mt-1 text-sm text-slate">
          Every hotel stay and tour package booking across the marketplace.
        </p>
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
              <tr>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-slate">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Users</h2>
          <AddUserForm />
        </div>
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const isSelf = u.id === session.userId;
                const isFixed = isFixedSuperAdmin(u.email);
                const locked = isSelf || isFixed;
                return (
                  <tr key={u.id} className="transition hover:bg-paper/50">
                    <td className="px-4 py-4 text-ink">
                      {u.name}
                      {isSelf && <span className="ml-1 text-xs text-slate">(you)</span>}
                      {!isSelf && isFixed && (
                        <span className="ml-1 text-xs text-slate">(fixed admin)</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate">{u.email}</td>
                    <td className="px-4 py-4">
                      <UserRoleSelect userId={u.id} role={u.role} disabled={locked} />
                    </td>
                    <td className="px-4 py-4 text-slate">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DeleteUserButton userId={u.id} disabled={locked} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-slate">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
