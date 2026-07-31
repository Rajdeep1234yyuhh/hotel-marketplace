"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    // NextAuth handles the OAuth redirect itself; the callback lands on
    // /api/auth/bridge, which turns the verified Google identity into our
    // own session cookie. This is the only way to gain hosting access —
    // the bridge route always grants SELLER, nothing else.
    await signIn("google", { callbackUrl: "/api/auth/bridge" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-ink/40 disabled:opacity-50"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.48-1.13 2.74-2.41 3.58v2.98h3.9c2.28-2.1 3.53-5.2 3.53-8.75Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.9-2.98c-1.08.73-2.46 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.92H1.28v3.07C3.26 21.3 7.31 24 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.31 14.36A7.2 7.2 0 0 1 4.93 12c0-.82.14-1.62.38-2.36V6.57H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.43l4.03-3.07Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.45-3.45C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.57l4.03 3.07C6.25 6.85 8.89 4.75 12 4.75Z"
        />
      </svg>
      {busy ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}
