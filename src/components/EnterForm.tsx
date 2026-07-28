"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Role = "BUYER" | "SELLER";

const roleCopy: Record<Role, { title: string; blurb: string; cta: string }> = {
  BUYER: {
    title: "I'm here to book",
    blurb: "Browse independent stays and reserve in a few taps.",
    cta: "Start booking",
  },
  SELLER: {
    title: "I'm here to host",
    blurb: "List a property and manage your rooms from one dashboard.",
    cta: "Start hosting",
  },
};

export function EnterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors(typeof data.error === "object" ? data.error : {});
      setSubmitting(false);
      return;
    }

    router.push(role === "SELLER" ? "/seller" : "/browse");
    router.refresh();
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
      <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Choose a role">
        {(Object.keys(roleCopy) as Role[]).map((r) => {
          const active = role === r;
          return (
            <button
              key={r}
              role="tab"
              aria-selected={active}
              onClick={() => setRole(r)}
              className={`rounded-xl border p-4 text-left transition ${
                active
                  ? "border-accent bg-accent text-white shadow-soft"
                  : "border-line bg-paper text-ink hover:border-accent/40"
              }`}
            >
              <span className="block text-sm font-semibold">{roleCopy[r].title}</span>
              <span
                className={`mt-1 block text-xs leading-snug ${
                  active ? "text-white/75" : "text-slate"
                }`}
              >
                {roleCopy[r].blurb}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="field-label">
            Name
          </label>
          <input
            id="name"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Rivera"
            autoComplete="name"
          />
          {errors.name && <p className="field-error">{errors.name[0]}</p>}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="field-error">{errors.email[0]}</p>}
        </div>

        <Button
          onClick={submit}
          disabled={submitting}
          className="w-full"
          variant="secondary"
        >
          {submitting ? "One moment…" : roleCopy[role].cta}
        </Button>
        <p className="text-center text-xs text-slate">
          No password needed for this demo. You can switch roles anytime from the top bar.
        </p>
      </div>
    </div>
  );
}
