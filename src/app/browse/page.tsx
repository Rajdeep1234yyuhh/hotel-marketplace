import { Suspense } from "react";
import Link from "next/link";
import { listHotels } from "@/lib/db";
import { getSession } from "@/lib/session";
import { HotelCard } from "@/components/HotelCard";
import { SearchBar } from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const session = getSession();

  const hotels = listHotels({ published: true, q: q || undefined });

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Find a stay</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            {q ? `Stays matching “${q}”` : "Places to stay"}
          </h1>
          <p className="mt-2 text-slate">
            {hotels.length} {hotels.length === 1 ? "property" : "properties"} available.
          </p>
        </div>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {hotels.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl font-bold text-ink">No stays here yet</p>
          <p className="mt-2 text-slate">
            {q
              ? "Try a different city or clear your search."
              : "Be the first to list a property."}
          </p>
          {session?.role === "SELLER" ? (
            <Link
              href="/seller/new"
              className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
            >
              List a property
            </Link>
          ) : (
            q && (
              <Link
                href="/browse"
                className="mt-6 inline-block rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/40"
              >
                Clear search
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} href={`/hotels/${hotel.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
