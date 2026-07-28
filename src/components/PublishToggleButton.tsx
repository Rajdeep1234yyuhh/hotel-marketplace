"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishToggleButton({
  hotelId,
  published,
}: {
  hotelId: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/hotels/${hotelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
        published
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-line text-slate hover:bg-line/70"
      }`}
    >
      {busy ? "…" : published ? "Published" : "Unpublished"}
    </button>
  );
}
