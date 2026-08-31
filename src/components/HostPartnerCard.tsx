"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const FEATURES = [
  { label: "Free listing", icon: "tag" },
  { label: "Low commission", icon: "coin" },
  { label: "Easy management", icon: "grid" },
  { label: "More bookings", icon: "trend" },
] as const;

function FeatureIcon({ icon }: { icon: (typeof FEATURES)[number]["icon"] }) {
  const props = {
    className: "h-4 w-4 text-accent-deep",
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
  };
  if (icon === "tag") {
    return (
      <svg {...props}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l8 8-9 9-8-8V4h8z"
        />
        <circle cx="8.5" cy="7.5" r="1.2" />
      </svg>
    );
  }
  if (icon === "coin") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path strokeLinecap="round" d="M12 7.5v9M9.5 9.5h4a1.8 1.8 0 010 3.6h-3a1.8 1.8 0 000 3.6h4" />
      </svg>
    );
  }
  if (icon === "grid") {
    return (
      <svg {...props}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 17l6-6 4 4 7-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8h5.5v5.5" />
    </svg>
  );
}

function HostIllustration() {
  return (
    <svg viewBox="0 0 220 180" className="h-auto w-full max-w-xs text-accent" fill="none">
      <ellipse cx="110" cy="160" rx="90" ry="10" className="fill-accent/10" />
      <path d="M40 150V90l70-45 70 45v60z" className="fill-accent/15" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" />
      <path d="M25 95L110 40l85 55" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="70" y="105" width="30" height="45" rx="2" className="fill-white" stroke="currentColor" strokeWidth={2.5} />
      <rect x="122" y="112" width="24" height="24" rx="2" className="fill-white" stroke="currentColor" strokeWidth={2.5} />
      <circle cx="150" cy="145" r="6" className="fill-white" stroke="currentColor" strokeWidth={2} />
      <rect x="158" y="140" width="18" height="26" rx="3" className="fill-accent-deep/80" />
      <rect x="162" y="146" width="10" height="3" rx="1" className="fill-white/80" />
    </svg>
  );
}

export function HostPartnerCard() {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await signIn("google", { callbackUrl: "/api/auth/bridge" });
  }

  return (
    <div className="overflow-hidden rounded-card border border-accent/15 bg-accent/5">
      <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="eyebrow">Partner with Travel Grid India</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            List your property with us
          </h2>
          <p className="mt-3 max-w-md text-slate">
            Reach thousands of travellers looking for unique stays across Northeast India.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm font-medium text-ink">
                <FeatureIcon icon={f.icon} />
                {f.label}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClick}
            disabled={busy}
            className="mt-7 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep disabled:opacity-50"
          >
            {busy ? "Redirecting…" : "List Your Property — It's Free"}
          </button>
        </div>

        <div className="hidden justify-center lg:flex">
          <HostIllustration />
        </div>
      </div>
    </div>
  );
}
