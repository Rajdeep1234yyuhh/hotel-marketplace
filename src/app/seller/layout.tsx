import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const NAV_ITEMS = [
  { href: "/seller", label: "Properties" },
  { href: "/seller/bookings", label: "Bookings" },
  { href: "/seller/rates", label: "Rates & Inventories" },
  { href: "/seller/packages", label: "Tour Packages" },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "SELLER" && session.role !== "ADMIN") redirect("/browse");

  return (
    <div className="container-page py-10">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">Host dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Your listings
        </h1>
        <p className="mt-2 text-slate">
          Manage the properties and tour packages you own or have been given access to.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar items={NAV_ITEMS} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
