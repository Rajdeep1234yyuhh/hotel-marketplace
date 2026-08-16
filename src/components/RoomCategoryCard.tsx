"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/validations";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { useRoomSelection } from "@/components/RoomSelectionContext";

type Props = {
  id: string;
  name: string;
  pricePerNight: number;
  totalRooms: number;
  description: string;
  photos: string[];
  amenities: string[];
  mealPlans: string[];
};

export function RoomCategoryCard({
  id,
  name,
  pricePerNight,
  totalRooms,
  description,
  photos,
  amenities,
  mealPlans,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { selectedId, chooseAndScroll } = useRoomSelection();
  const isSelected = selectedId === id;

  return (
    <div
      className={`overflow-hidden rounded-card border bg-white transition ${
        isSelected ? "border-accent ring-1 ring-accent" : "border-line"
      }`}
    >
      {photos[0] && (
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="block aspect-[4/3] w-full cursor-zoom-in bg-line"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt={name} className="h-full w-full object-cover" />
        </button>
      )}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-ink">{name}</h3>
          <span className="whitespace-nowrap text-sm font-bold text-ink">
            {formatMoney(pricePerNight)}
            <span className="text-xs font-normal text-slate"> /night</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-slate">
          {totalRooms} {totalRooms === 1 ? "room" : "rooms"} available
        </p>
        {description && <p className="mt-2 text-sm text-ink/80">{description}</p>}

        {amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {amenities.map((a) => (
              <span
                key={a}
                className="rounded-full border border-line bg-paper px-2 py-0.5 text-xs text-ink"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {mealPlans.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mealPlans.map((plan) => (
              <span
                key={plan}
                className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-deep"
              >
                {plan}
              </span>
            ))}
          </div>
        )}

        {photos.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {photos.slice(1).map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i + 1)}
                className="h-16 w-24 flex-none cursor-zoom-in overflow-hidden rounded-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => chooseAndScroll(id)}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
            isSelected
              ? "bg-accent/10 text-accent-deep"
              : "bg-ink text-paper hover:bg-ink/90"
          }`}
        >
          {isSelected ? "Selected for booking ✓" : "Select this room"}
        </button>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          alt={name}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
