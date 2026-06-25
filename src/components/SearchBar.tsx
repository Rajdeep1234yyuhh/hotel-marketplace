"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by hotel, city or country"
        className="field-input"
        aria-label="Search stays"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-ink px-4 text-sm font-medium text-paper transition hover:bg-ink/90"
      >
        Search
      </button>
    </form>
  );
}
