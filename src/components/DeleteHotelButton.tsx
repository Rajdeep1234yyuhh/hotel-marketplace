"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteHotelButton({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/hotels/${hotelId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-slate transition hover:text-red-600"
      >
        Remove
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <button
        onClick={remove}
        disabled={busy}
        className="font-medium text-red-600 disabled:opacity-50"
      >
        {busy ? "Removing…" : "Confirm"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-slate hover:text-ink"
      >
        Cancel
      </button>
    </span>
  );
}
