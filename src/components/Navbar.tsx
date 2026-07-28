"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  user: { name: string; role: "BUYER" | "SELLER" | "ADMIN" } | null;
};

export function Navbar({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function switchRole() {
    const next = user?.role === "SELLER" ? "BUYER" : "SELLER";
    setBusy(true);
    await fetch("/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setBusy(false);
    startTransition(() => {
      router.push(next === "SELLER" ? "/seller" : "/browse");
      router.refresh();
    });
  }

  async function signOut() {
    setBusy(true);
    await fetch("/api/session", { method: "DELETE" });
    setBusy(false);
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-white">
            T
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Travel<span className="text-accent">Grid</span> India
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/browse"
              className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-slate transition hover:bg-paper hover:text-ink sm:inline-block"
            >
              Browse stays
            </Link>
            {user.role === "SELLER" && (
              <Link
                href="/seller"
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-slate transition hover:bg-paper hover:text-ink sm:inline-block"
              >
                My listings
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-slate transition hover:bg-paper hover:text-ink sm:inline-block"
              >
                Admin panel
              </Link>
            )}

            <span className="ml-1 hidden items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-slate md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {user.name.split(" ")[0]} ·{" "}
              <span className="font-semibold text-ink">
                {user.role === "SELLER"
                  ? "Hosting"
                  : user.role === "ADMIN"
                  ? "Admin"
                  : "Booking"}
              </span>
            </span>

            {user.role !== "ADMIN" && (
              <button
                onClick={switchRole}
                disabled={busy || isPending}
                className="ml-1 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-deep disabled:opacity-50"
              >
                {user.role === "SELLER" ? "Switch to booking" : "Switch to hosting"}
              </button>
            )}
            <button
              onClick={signOut}
              disabled={busy || isPending}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate transition hover:text-ink disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
          >
            Get started
          </Link>
        )}
      </nav>
    </header>
  );
}
