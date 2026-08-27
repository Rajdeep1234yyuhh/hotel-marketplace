import Link from "next/link";
import Image from "next/image";

export function DestinationCard({
  city,
  country,
  coverImage,
  listingCount,
}: {
  city: string;
  country: string;
  coverImage: string;
  listingCount: number;
}) {
  return (
    <Link
      href={`/browse?q=${encodeURIComponent(city)}`}
      className="group relative aspect-[4/5] shrink-0 basis-40 overflow-hidden rounded-card border border-line bg-line transition hover:-translate-y-1 hover:shadow-lift sm:basis-44"
    >
      <Image
        src={coverImage}
        alt={city}
        fill
        sizes="(min-width: 640px) 176px, 160px"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-display text-base font-bold text-white">{city}</p>
        <p className="text-xs text-white/80">
          {country} · {listingCount} {listingCount === 1 ? "stay" : "stays"}
        </p>
      </div>
    </Link>
  );
}
