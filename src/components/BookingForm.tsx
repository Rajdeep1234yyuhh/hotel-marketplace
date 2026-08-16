"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatMoney, nightsBetween } from "@/lib/validations";
import { useRoomSelection } from "@/components/RoomSelectionContext";

type RoomCategoryOption = {
  id: string;
  name: string;
  pricePerNight: number;
  totalRooms: number;
  mealPlans: string[];
};

type Props = {
  hotelId: string;
  roomCategories: RoomCategoryOption[];
};

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingForm({ hotelId, roomCategories }: Props) {
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
  const [confirmed, setConfirmed] = useState<{ nights: number; total: number } | null>(
    null
  );

  // Meal plan options depend on which room category is selected — reset to
  // that category's first option whenever the selection changes.
  useEffect(() => {
    setMealPlan(selectedCategory?.mealPlans[0] ?? "Room Only");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCategoryId]);

  const effectiveRate = selectedCategory?.pricePerNight ?? 0;
  const availableMealPlans = selectedCategory?.mealPlans ?? ["Room Only"];

  const nights =
    checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
      ? nightsBetween(checkIn, checkOut)
      : 0;
  const total = useMemo(() => nights * effectiveRate, [nights, effectiveRate]);

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
      setErrors(typeof data.error === "object" ? data.error : {});
      setSubmitting(false);
      return;
    }

    setConfirmed({ nights: data.booking.nights, total: data.booking.total });
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
            className="field-input"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
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

      {nights > 0 && (
        <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-slate">
            <span>
              {formatMoney(effectiveRate)} × {nights}{" "}
              {nights === 1 ? "night" : "nights"}
            </span>
            <span>{formatMoney(total)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      )}

      <Button
        variant="secondary"
        className="mt-5 w-full"
        onClick={submit}
        disabled={submitting || nights === 0}
      >
        {submitting ? "Confirming…" : nights === 0 ? "Choose your dates" : "Reserve"}
      </Button>
      <p className="mt-2 text-center text-xs text-slate">
        You won&apos;t be charged — this is a demo reservation.
      </p>
    </div>
  );
}
