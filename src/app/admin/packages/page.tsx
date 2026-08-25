import Link from "next/link";
import { listTourPackages, packageBookingCountsByPackage, findUserById } from "@/lib/db";
import { DeletePackageButton } from "@/components/DeletePackageButton";
import { PublishTogglePackageButton } from "@/components/PublishTogglePackageButton";
import { ManagersEditor } from "@/components/ManagersEditor";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const [packageBookingCounts, allPackages] = await Promise.all([
    packageBookingCountsByPackage(),
    listTourPackages(),
  ]);

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

  return (
    <div>
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
  );
}
