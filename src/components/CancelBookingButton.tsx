"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setBusy(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-slate transition hover:text-red-600"
      >
        Cancel
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <button
        onClick={cancel}
        disabled={busy}
        className="font-medium text-red-600 disabled:opacity-50"
      >
        {busy ? "Cancelling…" : "Confirm"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-slate hover:text-ink">
        Back
      </button>
    </span>
  );
}
