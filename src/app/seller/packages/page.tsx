import Link from "next/link";
import { listTourPackages, packageBookingCountsByPackage, findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { DeletePackageButton } from "@/components/DeletePackageButton";
import { formatMoney } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function SellerPackagesPage() {
  const session = getSession();
  if (!session) return null;

  const currentUser = await findUserById(session.userId);

  const packageBookingCounts = await packageBookingCountsByPackage();
  const [ownedPackages, managedPackages] = await Promise.all([
    listTourPackages({ ownerId: session.userId }),
    currentUser
      ? listTourPackages({ managerEmail: currentUser.email.trim().toLowerCase() })
      : Promise.resolve([]),
  ]);
  const packagesById = new Map(
    [...ownedPackages, ...managedPackages].map((p) => [p.id, p])
  );
  const packages = Array.from(packagesById.values()).map((p) => ({
    ...p,
    managed: p.ownerId !== session.userId,
    _count: { bookings: packageBookingCounts[p.id] ?? 0 },
  }));
  const totalPackageBookings = packages.reduce((sum, p) => sum + p._count.bookings, 0);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Tour packages</h2>
          <p className="mt-1 text-sm text-slate">
            {packages.length} {packages.length === 1 ? "package" : "packages"} ·{" "}
            {totalPackageBookings} {totalPackageBookings === 1 ? "booking" : "bookings"} received.
          </p>
        </div>
        <Link
          href="/seller/packages/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
        >
          + Add a tour package
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl font-bold text-ink">No packages yet</p>
          <p className="mt-2 text-slate">
            Add your first tour package and it goes live in the marketplace instantly.
          </p>
          <Link
            href="/seller/packages/new"
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep"
          >
            Add your first tour package
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Destination</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Bookings</th>
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
                    {p.managed && (
                      <span className="ml-1.5 rounded-full bg-line px-1.5 py-0.5 text-[10px] font-medium text-slate">
                        Managed
                      </span>
                    )}
                    <p className="text-xs text-slate sm:hidden">{p.destination}</p>
                    <p className="text-xs text-slate">
                      {p.durationDays}D / {p.durationNights}N
                    </p>
                  </td>
                  <td className="hidden px-4 py-4 text-slate sm:table-cell">
                    {p.destination}
                  </td>
                  <td className="px-4 py-4 text-ink">
                    {formatMoney(p.pricePerPerson)}
                    <span className="text-slate"> / person</span>
                  </td>
                  <td className="hidden px-4 py-4 text-ink md:table-cell">
                    {p._count.bookings}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/seller/packages/${p.id}/edit`}
                        className="text-xs font-medium text-slate transition hover:text-ink"
                      >
                        Edit
                      </Link>
                      <DeletePackageButton packageId={p.id} />
                    </div>
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
