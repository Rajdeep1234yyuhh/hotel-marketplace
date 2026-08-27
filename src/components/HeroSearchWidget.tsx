"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearchWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<"stays" | "packages">("stays");
  const [where, setWhere] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = where.trim();
    const base = tab === "stays" ? "/browse" : "/packages";
    router.push(q ? `${base}?q=${encodeURIComponent(q)}` : base);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-lift sm:p-5">
      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === "stays"} onClick={() => setTab("stays")}>
          Stays
        </TabButton>
        <TabButton active={tab === "packages"} onClick={() => setTab("packages")}>
          Packages
        </TabButton>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="hero-where" className="field-label">
            Where
          </label>
          <input
            id="hero-where"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder={
              tab === "stays"
                ? "Search destinations, hotels or homestays"
                : "Search destinations or tour packages"
            }
            className="field-input"
          />
        </div>
        {tab === "stays" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="hero-checkin" className="field-label">
                Check-in
              </label>
              <input
                id="hero-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="hero-checkout" className="field-label">
                Check-out
              </label>
              <input
                id="hero-checkout"
                type="date"
                min={checkIn || undefined}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="hero-guests" className="field-label">
                Guests &amp; Rooms
              </label>
              <select
                id="hero-guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="field-input"
              >
                <option value="1">1 Guest · 1 Room</option>
                <option value="2">2 Guests · 1 Room</option>
                <option value="3">3 Guests · 1 Room</option>
                <option value="4">4 Guests · 2 Rooms</option>
                <option value="6">6 Guests · 2 Rooms</option>
              </select>
            </div>
          </div>
        )}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="9" cy="9" r="6" />
            <path strokeLinecap="round" d="M18 18l-4.35-4.35" />
          </svg>
          Search {tab === "stays" ? "stays" : "packages"}
        </button>
      </form>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition ${
        active ? "border-accent text-accent-deep" : "border-transparent text-slate hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
