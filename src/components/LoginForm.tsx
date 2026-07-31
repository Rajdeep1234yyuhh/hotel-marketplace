"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        typeof data.error === "string"
          ? data.error
          : data.error?.email?.[0] ?? "Couldn't sign you in";
      setError(message);
      setSubmitting(false);
      return;
    }

    router.push(data.user.role === "SELLER" ? "/seller" : "/browse");
    router.refresh();
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Log in</h1>
      <p className="mt-1 text-sm text-slate">
        Enter the email you signed up with — no password needed for this demo.
      </p>

      <div className="mt-6 space-y-4">
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
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {error && <p className="field-error">{error}</p>}
        </div>

        <Button onClick={submit} disabled={submitting} className="w-full" variant="secondary">
          {submitting ? "Signing in…" : "Log in"}
        </Button>

        <p className="text-center text-xs text-slate">
          New here?{" "}
          <Link href="/#get-started" className="font-medium text-ink underline underline-offset-4">
            Get started
          </Link>{" "}
          instead.
        </p>
      </div>
    </div>
  );
}
