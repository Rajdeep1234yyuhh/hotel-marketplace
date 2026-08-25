import {
  listHotels,
  listTourPackages,
  listUsers,
  countBookings,
  countPackageBookings,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [hotels, packages, users, bookingsCount, packageBookingsCount] = await Promise.all([
    listHotels(),
    listTourPackages(),
    listUsers(),
    countBookings(),
    countPackageBookings(),
  ]);

  const publishedCount = hotels.filter((h) => h.published).length;
  const publishedPackageCount = packages.filter((p) => p.published).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
