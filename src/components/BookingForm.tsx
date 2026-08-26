"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatMoney, MAX_STAY_NIGHTS } from "@/lib/validations";
import { useRoomSelection } from "@/components/RoomSelectionContext";

type RoomCategoryOption = {
  id: string;
  name: string;
  pricePerNight: number;
  totalRooms: number;
  mealPlans: string[];
};

type RateOverrideLite = {
  roomCategoryId: string;
  date: string;
  rate: number | null;
  availableRooms: number | null;
  closed: boolean;
};

type Props = {
  hotelId: string;
  roomCategories: RoomCategoryOption[];
  rateOverrides: RateOverrideLite[];
};

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Bounded by MAX_STAY_NIGHTS so a wildly out-of-range checkout date (easy to
// hit by scrolling a native date picker's year field too far) can't spin
// this into a loop over hundreds of thousands of days.
function datesBetween(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  let d = checkIn;
  let guard = 0;
  while (d < checkOut && guard <= MAX_STAY_NIGHTS) {
    dates.push(d);
    d = addDays(d, 1);
    guard++;
  }
  return dates;
}

export function BookingForm({ hotelId, roomCategories, rateOverrides }: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(isoToday());
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const { selectedId: roomCategoryId, setSelectedId: setRoomCategoryId } = useRoomSelection();
  const selectedCategory = roomCategories.find((c) => c.id === roomCategoryId);
  const [mealPlan, setMealPlan] = useState(selectedCategory?.mealPlans[0] ?? "Room Only");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<
    { reference: string; nights: number; total: number } | null
  >(null);

  // Meal plan options depend on which room category is selected — reset to
  // that category's first option whenever the selection changes.
  useEffect(() => {
    setMealPlan(selectedCategory?.mealPlans[0] ?? "Room Only");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCategoryId]);

  const overrideMap = useMemo(() => {
    const m = new Map<string, RateOverrideLite>();
    rateOverrides.forEach((o) => m.set(`${o.roomCategoryId}|${o.date}`, o));
    return m;
  }, [rateOverrides]);

  const effectiveRate = selectedCategory?.pricePerNight ?? 0;
  const availableMealPlans = selectedCategory?.mealPlans ?? ["Room Only"];

  const rawNights =
    checkIn && checkOut
      ? (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
      : 0;
  const isValidRange = rawNights > 0;
  const exceedsMaxStay = isValidRange && rawNights > MAX_STAY_NIGHTS;

  const nightDates = useMemo(() => {
    if (!isValidRange || exceedsMaxStay) return [];
    return datesBetween(checkIn, checkOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, isValidRange, exceedsMaxStay]);

  const nightBreakdown = useMemo(
    () =>
      nightDates.map((date) => {
        const o = selectedCategory ? overrideMap.get(`${selectedCategory.id}|${date}`) : undefined;
        const rate = o?.rate ?? effectiveRate;
        const available = o?.closed
          ? 0
          : o?.availableRooms ?? selectedCategory?.totalRooms ?? 0;
        return { date, rate, available };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nightDates.join(","), selectedCategory?.id, overrideMap, effectiveRate]
  );

  const soldOutDates = nightBreakdown.filter((n) => n.available <= 0);
  const isSoldOut = nightBreakdown.length > 0 && soldOutDates.length > 0;
  const nights = nightDates.length;
  const total = useMemo(
    () => nightBreakdown.reduce((sum, n) => sum + n.rate, 0),
    [nightBreakdown]
  );

  async function submit() {
    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId,
        guestName,
        email,
        checkIn,
        checkOut,
        guests,
        mealPlan,
        roomCategoryId,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(
        typeof data.error === "object" ? data.error : { _: [String(data.error ?? "Something went wrong")] }
      );
      setSubmitting(false);
      return;
    }

    setConfirmed({
      reference: data.booking.reference,
      nights: data.booking.nights,
      total: data.booking.total,
    });
    setSubmitting(false);
    router.refresh();
  }

  if (roomCategories.length === 0) {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-lift">
        <p className="text-sm text-slate">
          This property doesn&apos;t have any bookable room categories yet.
        </p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-lift">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
          ✓
        </div>
        <h3 className="font-display text-xl font-bold text-ink">Booking confirmed</h3>
        <p className="mt-1 text-sm text-slate">
          {confirmed.nights} {confirmed.nights === 1 ? "night" : "nights"} ·{" "}
          {formatMoney(confirmed.total)} total. A confirmation has been
          recorded for {email}.
        </p>
        <div className="mt-3 rounded-lg border border-line bg-paper/60 px-3 py-2">
          <p className="text-xs text-slate">Booking reference</p>
          <p className="font-display text-base font-bold tracking-wide text-ink">
            {confirmed.reference}
          </p>
        </div>
        <Button
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => {
            setConfirmed(null);
            setCheckOut("");
          }}
        >
          Book another stay
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-lift">
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold text-ink">
          {formatMoney(effectiveRate)}
        </span>
        <span className="text-sm text-slate">/ night</span>
      </div>

      <div className="mt-5">
        <label htmlFor="roomCategory" className="field-label">
          Room category
        </label>
        <select
          id="roomCategory"
          className="field-input"
          value={roomCategoryId}
          onChange={(e) => setRoomCategoryId(e.target.value)}
        >
          {roomCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {formatMoney(c.pricePerNight)}/night · {c.totalRooms}{" "}
              {c.totalRooms === 1 ? "room" : "rooms"}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label htmlFor="mealPlan" className="field-label">
          Meal plan
        </label>
        <select
          id="mealPlan"
          className="field-input"
          value={mealPlan}
          onChange={(e) => setMealPlan(e.target.value)}
        >
          {availableMealPlans.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="checkIn" className="field-label">
            Check-in
          </label>
          <input
            id="checkIn"
            type="date"
            min={isoToday()}
            className="field-input"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="checkOut" className="field-label">
            Check-out
          </label>
          <input
            id="checkOut"
            type="date"
            min={checkIn || isoToday()}
            max={addDays(checkIn || isoToday(), MAX_STAY_NIGHTS)}
            className="field-input"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          {exceedsMaxStay && (
            <p className="field-error">Stays can&apos;t be longer than {MAX_STAY_NIGHTS} nights</p>
          )}
          {errors.checkOut && <p className="field-error">{errors.checkOut[0]}</p>}
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="guests" className="field-label">
          Guests
        </label>
        <input
          id="guests"
          type="number"
          min={1}
          max={20}
          className="field-input"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <div>
          <label htmlFor="guestName" className="field-label">
            Guest name
          </label>
          <input
            id="guestName"
            className="field-input"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Name on the booking"
          />
          {errors.guestName && <p className="field-error">{errors.guestName[0]}</p>}
        </div>
        <div>
          <label htmlFor="bookingEmail" className="field-label">
            Email
          </label>
          <input
            id="bookingEmail"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="confirmation@example.com"
          />
          {errors.email && <p className="field-error">{errors.email[0]}</p>}
        </div>
      </div>

      {isSoldOut && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
          Sold Out for the selected dates. Try different dates or another room category.
        </div>
      )}

      {!isSoldOut && nights > 0 && (
        <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          {nightBreakdown.every((n) => n.rate === nightBreakdown[0].rate) ? (
            <div className="flex justify-between text-slate">
              <span>
                {formatMoney(effectiveRate)} × {nights} {nights === 1 ? "night" : "nights"}
              </span>
              <span>{formatMoney(total)}</span>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-slate">
              {nightBreakdown.map((n) => (
                <div key={n.date} className="flex justify-between">
                  <span>{new Date(`${n.date}T00:00:00`).toLocaleDateString()}</span>
                  <span>{formatMoney(n.rate)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      )}

      {errors._ && <p className="field-error mt-3">{errors._[0]}</p>}

      <Button
        variant="secondary"
        className="mt-5 w-full"
        onClick={submit}
        disabled={submitting || nights === 0 || isSoldOut}
      >
        {submitting
          ? "Confirming…"
          : nights === 0
          ? "Choose your dates"
          : isSoldOut
          ? "Sold Out"
          : "Reserve"}
      </Button>
      <p className="mt-2 text-center text-xs text-slate">
        You won&apos;t be charged — this is a demo reservation.
      </p>
    </div>
  );
}
