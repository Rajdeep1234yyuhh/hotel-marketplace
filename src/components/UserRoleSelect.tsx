"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "BUYER" | "SELLER" | "ADMIN";

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: Role) {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <select
      value={role}
      disabled={disabled || busy}
      onChange={(e) => change(e.target.value as Role)}
      className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink disabled:opacity-50"
      title={disabled ? "This account's role can't be changed" : undefined}
    >
      <option value="BUYER">BUYER</option>
      <option value="SELLER">SELLER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}
