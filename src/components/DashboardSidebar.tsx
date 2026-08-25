"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarItem = { href: string; label: string };

// The item whose href is the longest matching prefix of the current path
// "wins" — so /admin/hotels/new highlights "Hotels" and not "Overview",
// while /seller/packages/new highlights "Tour Packages" and not "Properties".
function bestMatch(pathname: string, items: SidebarItem[]): string | null {
  let best: SidebarItem | null = null;
  for (const item of items) {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.href.length)) {
      best = item;
    }
  }
  return best?.href ?? null;
}

export function DashboardSidebar({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();
  const activeHref = bestMatch(pathname, items);

  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
            item.href === activeHref
              ? "bg-ink text-paper"
              : "text-slate hover:bg-white hover:text-ink"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
