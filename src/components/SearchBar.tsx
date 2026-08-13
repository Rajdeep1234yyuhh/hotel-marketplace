"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar({
  action = "/browse",
  placeholder = "Search by hotel, city or country",
}: {
  action?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `${action}?q=${encodeURIComponent(q)}` : action);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="field-input"
        aria-label="Search"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
      >
        Search
      </button>
    </form>
  );
}
