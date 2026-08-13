import { Suspense } from "react";
import Link from "next/link";
import { listTourPackages } from "@/lib/db";
import { getSession } from "@/lib/session";
import { TourPackageCard } from "@/components/TourPackageCard";
import { SearchBar } from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const session = getSession();

  const packages = await listTourPackages({ published: true, q: q || undefined });

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Tour packages</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            {q ? `Packages matching “${q}”` : "Guided trips & holidays"}
          </h1>
          <p className="mt-2 text-slate">
            {packages.length} {packages.length === 1 ? "package" : "packages"} available.
          </p>
        </div>
        <Suspense>
          <SearchBar action="/packages" placeholder="Search by destination or title" />
        </Suspense>
      </div>

      {packages.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl font-bold text-ink">No packages here yet</p>
          <p className="mt-2 text-slate">
            {q
              ? "Try a different destination or clear your search."
              : "Be the first to list a tour package."}
          </p>
          {session?.role === "SELLER" || session?.role === "ADMIN" ? (
            <Link
              href="/seller/packages/new"
              className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
            >
              List a package
            </Link>
          ) : (
            q && (
              <Link
                href="/packages"
                className="mt-6 inline-block rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/40"
              >
                Clear search
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <TourPackageCard key={p.id} tourPackage={p} href={`/packages/${p.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
