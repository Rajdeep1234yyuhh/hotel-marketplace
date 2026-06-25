import Link from "next/link";
import { formatMoney } from "@/lib/validations";

export type HotelCardData = {
  id: string;
  name: string;
  city: string;
  country: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  imageUrl: string;
};

export function HotelCard({
  hotel,
  href,
}: {
  hotel: HotelCardData;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hotel.imageUrl}
          alt={hotel.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {hotel.rating > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
            ★ {hotel.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wider text-slate">
          {hotel.city}, {hotel.country}
        </p>
        <h3 className="mt-1 font-display text-lg leading-tight text-ink">
          {hotel.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-1 pt-3">
          <span className="text-lg font-semibold text-ink">
            {formatMoney(hotel.pricePerNight, hotel.currency)}
          </span>
          <span className="text-sm text-slate">/ night</span>
        </div>
      </div>
    </Link>
  );
}
