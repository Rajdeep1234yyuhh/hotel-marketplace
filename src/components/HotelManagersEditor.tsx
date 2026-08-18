"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HotelManagersEditor({
  hotelId,
  managerEmails,
}: {
  hotelId: string;
  managerEmails: string[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addManager() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/hotels/${hotelId}/managers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const fieldErrors = data.error;
      const message =
        typeof fieldErrors === "object"
          ? Object.values(fieldErrors).flat().join(" ")
          : String(fieldErrors ?? "Something went wrong");
      setError(message);
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function removeManager(target: string) {
    setBusy(true);
    await fetch(`/api/admin/hotels/${hotelId}/managers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-1.5">
      {managerEmails.length > 0 && (
        <ul className="space-y-1">
          {managerEmails.map((m) => (
            <li key={m} className="flex items-center justify-between gap-2">
              <span className="truncate">{m}</span>
              <button
                onClick={() => removeManager(m)}
                disabled={busy}
                className="shrink-0 text-xs font-medium text-slate transition hover:text-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="manager@email.com"
          className="field-input h-7 flex-1 text-xs"
        />
        <button
          onClick={addManager}
          disabled={busy || !email.trim()}
          className="h-7 shrink-0 rounded-md bg-accent px-2 text-xs font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="field-error text-xs">{error}</p>}
    </div>
  );
}
