"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  user: { name: string; role: "BUYER" | "SELLER" } | null;
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
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Verandah
          </span>
          <span className="hidden text-xs text-slate sm:inline">stay &amp; host</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/browse"
              className="hidden rounded-md px-3 py-2 text-sm text-slate transition hover:text-ink sm:inline-block"
            >
              Browse stays
            </Link>
            {user.role === "SELLER" && (
              <Link
                href="/seller"
                className="hidden rounded-md px-3 py-2 text-sm text-slate transition hover:text-ink sm:inline-block"
              >
                My listings
              </Link>
            )}

            <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-slate md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-brass" />
              {user.name.split(" ")[0]} ·{" "}
              <span className="font-medium text-ink">
                {user.role === "SELLER" ? "Hosting" : "Booking"}
              </span>
            </span>

            <button
              onClick={switchRole}
              disabled={busy || isPending}
              className="rounded-lg bg-brass px-3 py-2 text-xs font-medium text-ink transition hover:bg-brass-deep hover:text-paper disabled:opacity-50"
            >
              {user.role === "SELLER" ? "Switch to booking" : "Switch to hosting"}
            </button>
            <button
              onClick={signOut}
              disabled={busy || isPending}
              className="rounded-lg px-3 py-2 text-xs text-slate transition hover:text-ink disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/90"
          >
            Get started
          </Link>
        )}
      </nav>
    </header>
  );
}
