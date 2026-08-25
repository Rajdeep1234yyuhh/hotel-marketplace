import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/hotels", label: "Hotels" },
  { href: "/admin/packages", label: "Tour Packages" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "ADMIN") redirect("/browse");

  return (
    <div className="container-page py-10">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">Super admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Marketplace dashboard
        </h1>
        <p className="mt-2 text-slate">
          Every hotelier, listing, and booking across the marketplace.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar items={NAV_ITEMS} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
