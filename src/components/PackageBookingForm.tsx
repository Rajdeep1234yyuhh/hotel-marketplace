"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/validations";

type Props = {
  packageId: string;
  pricePerPerson: number;
};

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function PackageBookingForm({ packageId, pricePerPerson }: Props) {
  const router = useRouter();
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ total: number } | null>(null);

  const total = useMemo(() => travelers * pricePerPerson, [travelers, pricePerPerson]);

  async function submit() {
    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/package-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, guestName, email, travelDate, travelers }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(typeof data.error === "object" ? data.error : {});
      setSubmitting(false);
      return;
    }

    setConfirmed({ total: data.booking.total });
    setSubmitting(false);
    router.refresh();
  }

  if (confirmed) {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-lift">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
          ✓
        </div>
        <h3 className="font-display text-xl font-bold text-ink">Booking confirmed</h3>
        <p className="mt-1 text-sm text-slate">
          {formatMoney(confirmed.total)} total. A confirmation has been recorded for {email}.
        </p>
        <Button
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => {
            setConfirmed(null);
            setTravelDate("");
          }}
        >
          Book another trip
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-lift">
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold text-ink">
          {formatMoney(pricePerPerson)}
        </span>
        <span className="text-sm text-slate">/ person</span>
      </div>

      <div className="mt-5">
        <label htmlFor="travelDate" className="field-label">
          Travel date
        </label>
        <input
          id="travelDate"
          type="date"
          min={isoToday()}
          className="field-input"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
        />
        {errors.travelDate && <p className="field-error">{errors.travelDate[0]}</p>}
      </div>

      <div className="mt-3">
        <label htmlFor="travelers" className="field-label">
          Travellers
        </label>
        <input
          id="travelers"
          type="number"
          min={1}
          max={20}
          className="field-input"
          value={travelers}
          onChange={(e) => setTravelers(Number(e.target.value))}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <div>
          <label htmlFor="guestName" className="field-label">
            Traveller name
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

      <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-slate">
          <span>
            {formatMoney(pricePerPerson)} × {travelers}{" "}
            {travelers === 1 ? "traveller" : "travellers"}
          </span>
          <span>{formatMoney(total)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-ink">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>

      <Button
        variant="secondary"
        className="mt-5 w-full"
        onClick={submit}
        disabled={submitting || !travelDate}
      >
        {submitting ? "Confirming…" : !travelDate ? "Choose a travel date" : "Reserve"}
      </Button>
      <p className="mt-2 text-center text-xs text-slate">
        You won&apos;t be charged — this is a demo reservation.
      </p>
    </div>
  );
}
