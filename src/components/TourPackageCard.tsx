import Link from "next/link";
import { formatMoney } from "@/lib/validations";

export type TourPackageCardData = {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  pricePerPerson: number;
  coverImage: string;
};

export function TourPackageCard({
  tourPackage,
  href,
}: {
  tourPackage: TourPackageCardData;
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
          src={tourPackage.coverImage}
          alt={tourPackage.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          {tourPackage.durationDays}D / {tourPackage.durationNights}N
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate">
          {tourPackage.destination}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-ink">
          {tourPackage.title}
        </h3>

        <div className="mt-auto flex items-baseline gap-1 pt-3">
          <div>
            <p className="text-[11px] text-slate">Starting from</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-ink">
                {formatMoney(tourPackage.pricePerPerson)}
              </span>
              <span className="text-xs text-slate">/ person</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
