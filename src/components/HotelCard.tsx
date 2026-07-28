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

function ratingLabel(rating: number) {
  if (rating >= 4.7) return "Exceptional";
  if (rating >= 4.3) return "Excellent";
  if (rating >= 3.8) return "Very good";
  if (rating >= 3) return "Good";
  return "";
}

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
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hotel.imageUrl}
          alt={hotel.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {hotel.rating >= 4.5 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
            Top rated
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate">
          {hotel.city}, {hotel.country}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-ink">
          {hotel.name}
        </h3>

        {hotel.rating > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white">
              {hotel.rating.toFixed(1)}
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
              </svg>
            </span>
            <span className="text-xs font-medium text-ink">{ratingLabel(hotel.rating)}</span>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-1 pt-3">
          <div>
            <p className="text-[11px] text-slate">Starting from</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-ink">
                {formatMoney(hotel.pricePerNight, hotel.currency)}
              </span>
              <span className="text-xs text-slate">/ night</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
