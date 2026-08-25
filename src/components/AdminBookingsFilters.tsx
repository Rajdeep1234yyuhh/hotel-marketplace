"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export function AdminBookingsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function pushWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    pushWith({ q: q.trim() || undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={submitSearch} className="min-w-[220px] flex-1">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by reference, guest, email or listing"
          className="field-input"
          aria-label="Search bookings"
        />
      </form>

      <select
        className="field-input w-auto"
        value={params.get("type") ?? ""}
        onChange={(e) => pushWith({ type: e.target.value || undefined })}
      >
        <option value="">All types</option>
        <option value="hotel">Hotel stay</option>
        <option value="package">Tour package</option>
      </select>

      <select
        className="field-input w-auto"
        value={params.get("status") ?? ""}
        onChange={(e) => pushWith({ status: e.target.value || undefined })}
      >
        <option value="">All status</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          className="field-input w-auto"
          value={params.get("from") ?? ""}
          onChange={(e) => pushWith({ from: e.target.value || undefined })}
          aria-label="From date"
        />
        <span className="text-xs text-slate">to</span>
        <input
          type="date"
          className="field-input w-auto"
          value={params.get("to") ?? ""}
          onChange={(e) => pushWith({ to: e.target.value || undefined })}
          aria-label="To date"
        />
      </div>

      {(params.get("q") ||
        params.get("type") ||
        params.get("status") ||
        params.get("from") ||
        params.get("to")) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs font-medium text-slate transition hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
