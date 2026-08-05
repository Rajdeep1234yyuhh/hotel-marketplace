"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "BUYER" | "SELLER" | "ADMIN";

export function AddUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("BUYER");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      const fieldErrors = data.error;
      const message =
        typeof fieldErrors === "object"
          ? Object.values(fieldErrors).flat().join(" ")
          : String(fieldErrors ?? "Something went wrong");
      setError(message);
      return;
    }
    setName("");
    setEmail("");
    setRole("BUYER");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-deep"
      >
        + Add user
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-paper/50 p-3">
      <div>
        <label className="field-label" htmlFor="newUserName">
          Name
        </label>
        <input
          id="newUserName"
          className="field-input h-9 w-36 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="newUserEmail">
          Email
        </label>
        <input
          id="newUserEmail"
          type="email"
          className="field-input h-9 w-52 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="newUserRole">
          Role
        </label>
        <select
          id="newUserRole"
          className="field-input h-9 w-28 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="BUYER">BUYER</option>
          <option value="SELLER">SELLER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <button
        onClick={submit}
        disabled={submitting || !name.trim() || !email.trim()}
        className="h-9 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-deep disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Add"}
      </button>
      <button
        onClick={() => setOpen(false)}
        type="button"
        className="h-9 rounded-lg px-3 text-xs font-medium text-slate hover:text-ink"
      >
        Cancel
      </button>
      {error && <p className="field-error w-full">{error}</p>}
    </div>
  );
}
