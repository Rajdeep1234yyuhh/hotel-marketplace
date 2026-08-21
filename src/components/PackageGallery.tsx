"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoLightbox } from "@/components/PhotoLightbox";

export function PackageGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl font-bold text-ink">Gallery</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-md"
          >
            <Image
              src={p}
              alt={alt}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          alt={alt}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
