"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EditableReference({
  reference,
  apiPath,
}: {
  reference: string;
  apiPath: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(reference);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed || trimmed === reference) {
      setEditing(false);
      setValue(reference);
      setError("");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(apiPath, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      const fieldErrors = data.error;
      const message =
        typeof fieldErrors === "object"
          ? Object.values(fieldErrors).flat().join(" ")
          : String(fieldErrors ?? "Couldn't save");
      setError(message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  function cancel() {
    setValue(reference);
    setError("");
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded font-mono text-xs font-medium text-ink underline decoration-dotted underline-offset-2 transition hover:text-accent-deep"
        title="Click to edit reference"
      >
        {reference || "—"}
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="w-32 rounded-md border border-line px-1.5 py-1 font-mono text-xs"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="text-xs font-medium text-accent-deep disabled:opacity-50"
        >
          {saving ? "…" : "Save"}
        </button>
        <button type="button" onClick={cancel} className="text-xs text-slate hover:text-ink">
          Cancel
        </button>
      </div>
      {error && <p className="field-error text-[10px]">{error}</p>}
    </div>
  );
}
