"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteUserButton({
  userId,
  disabled,
}: {
  userId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  if (disabled) {
    return (
      <span className="text-xs text-slate/50" title="This account can't be deleted">
        Remove
      </span>
    );
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
      <button onClick={() => setConfirming(false)} className="text-slate hover:text-ink">
        Cancel
      </button>
    </span>
  );
}
