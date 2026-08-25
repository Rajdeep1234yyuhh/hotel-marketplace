"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export function BookingsFilters({
  properties,
}: {
  properties: { id: string; name: string }[];
}) {
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
          placeholder="Search by reference, guest name, phone or email"
          className="field-input"
          aria-label="Search reservations"
        />
      </form>

      {properties.length > 1 && (
        <select
          className="field-input w-auto"
          value={params.get("hotelId") ?? ""}
          onChange={(e) => pushWith({ hotelId: e.target.value || undefined })}
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <select
        className="field-input w-auto"
        value={params.get("status") ?? ""}
        onChange={(e) => pushWith({ status: e.target.value || undefined })}
      >
        <option value="">All status</option>
        <option value="UPCOMING">Upcoming</option>
        <option value="IN_HOUSE">In House</option>
        <option value="CHECKED_OUT">Checked Out</option>
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
        params.get("status") ||
        params.get("hotelId") ||
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
