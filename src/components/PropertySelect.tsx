"use client";

import { useRouter } from "next/navigation";

export function PropertySelect({
  hotels,
  selectedId,
  basePath,
}: {
  hotels: { id: string; name: string }[];
  selectedId: string;
  basePath: string;
}) {
  const router = useRouter();

  if (hotels.length <= 1) return null;

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`${basePath}?hotelId=${e.target.value}`)}
      className="field-input w-auto"
      aria-label="Property"
    >
      {hotels.map((h) => (
        <option key={h.id} value={h.id}>
          {h.name}
        </option>
      ))}
    </select>
  );
}
