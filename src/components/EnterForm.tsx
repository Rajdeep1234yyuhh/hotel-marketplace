"use client";

import Link from "next/link";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

type Role = "BUYER" | "SELLER";

const roleCopy: Record<Role, { title: string; blurb: string }> = {
  BUYER: {
    title: "I'm here to book",
    blurb: "Browse independent stays and reserve in a few taps — no sign-in needed.",
  },
  SELLER: {
    title: "I'm here to host",
    blurb: "Sign in with Google to open your host dashboard and start taking bookings.",
  },
};

export function EnterForm() {
  // Hosting is the default — this panel exists mainly to get hosts signed in;
  // booking never needs any of this, it just hands off to /browse.
  const [role, setRole] = useState<Role>("SELLER");

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
      <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Choose a role">
        {(Object.keys(roleCopy) as Role[]).map((r) => {
          const active = role === r;
          return (
            <button
              key={r}
              role="tab"
              aria-selected={active}
              onClick={() => setRole(r)}
              className={`rounded-xl border p-4 text-left transition ${
                active
                  ? "border-accent bg-accent text-white shadow-soft"
                  : "border-line bg-paper text-ink hover:border-accent/40"
              }`}
            >
              <span className="block text-sm font-semibold">{roleCopy[r].title}</span>
              <span
                className={`mt-1 block text-xs leading-snug ${
                  active ? "text-white/75" : "text-slate"
                }`}
              >
                {roleCopy[r].blurb}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {role === "SELLER" ? (
          <GoogleSignInButton />
        ) : (
          <Link
            href="/browse"
            className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
          >
            Browse stays
          </Link>
        )}
      </div>
    </div>
  );
}
