"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearchWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<"stays" | "packages">("stays");
  const [where, setWhere] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

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
      <form onSubmit={submit} className="mt-4">
        <div className={`grid grid-cols-1 gap-3 ${tab === "stays" ? "sm:grid-cols-4" : ""}`}>
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
            <>
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
              <GuestsRoomsPicker
                guests={guests}
                rooms={rooms}
                onGuestsChange={setGuests}
                onRoomsChange={setRooms}
              />
            </>
          )}
        </div>
        <button
          type="submit"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
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

function GuestsRoomsPicker({
  guests,
  rooms,
  onGuestsChange,
  onRoomsChange,
}: {
  guests: number;
  rooms: number;
  onGuestsChange: (n: number) => void;
  onRoomsChange: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="hero-guests-rooms" className="field-label">
        Guests &amp; Rooms
      </label>
      <button
        id="hero-guests-rooms"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field-input flex items-center justify-between text-left"
      >
        <span>
          {guests} {guests === 1 ? "Guest" : "Guests"} · {rooms} {rooms === 1 ? "Room" : "Rooms"}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full min-w-[220px] rounded-lg border border-line bg-white p-4 shadow-lift">
          <Stepper label="Guests" value={guests} min={1} max={20} onChange={onGuestsChange} />
          <Stepper label="Rooms" value={rooms} min={1} max={10} onChange={onRoomsChange} />
        </div>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-sm font-medium text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <span className="w-4 text-center text-sm font-medium text-ink">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-sm font-medium text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
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
