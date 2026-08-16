import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { findTourPackageById, findUserById, itineraryForPackage } from "@/lib/db";
import { PackageBookingForm } from "@/components/PackageBookingForm";
import { toList } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function PackageDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const packageRecord = await findTourPackageById(params.id);
  if (!packageRecord) notFound();

  const [owner, itinerary] = await Promise.all([
    findUserById(packageRecord.ownerId),
    itineraryForPackage(packageRecord.id),
  ]);

  const photos = toList(packageRecord.photos);
  const inclusions = toList(packageRecord.inclusions);
  const exclusions = toList(packageRecord.exclusions);
  const highlights = toList(packageRecord.highlights);

  return (
    <div className="container-page py-8">
      <Link
        href="/packages"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition hover:text-ink"
      >
        ← Back to packages
      </Link>

      <div className="relative mt-4 h-72 overflow-hidden rounded-card border border-line shadow-soft sm:h-96">
        <Image
          src={packageRecord.coverImage}
          alt={packageRecord.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow">{packageRecord.destination}</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight tracking-tight text-ink">
            {packageRecord.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate">
            <span>
              {packageRecord.durationDays} {packageRecord.durationDays === 1 ? "Day" : "Days"} /{" "}
              {packageRecord.durationNights} {packageRecord.durationNights === 1 ? "Night" : "Nights"}
            </span>
            <span>Hosted by {owner?.name ?? "Host"}</span>
          </div>

          <p className="mt-6 max-w-prose leading-relaxed text-ink/80">
            {packageRecord.description}
          </p>

          {highlights.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {highlights.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-deep"
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          {itinerary.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink">Itinerary</h2>
              <div className="mt-4 space-y-3">
                {itinerary.map((day) => (
                  <div key={day.id} className="rounded-card border border-line bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-deep">
                        {day.dayNumber}
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-ink">{day.title}</h3>
                        {day.description && (
                          <p className="mt-1 text-sm text-ink/80">{day.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {inclusions.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Inclusions</h2>
                  <ul className="mt-2 space-y-1 text-sm text-ink/80">
                    {inclusions.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-600">✓</span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {exclusions.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Exclusions</h2>
                  <ul className="mt-2 space-y-1 text-sm text-ink/80">
                    {exclusions.map((e) => (
                      <li key={e} className="flex gap-2">
                        <span className="text-red-500">✕</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square w-full overflow-hidden rounded-md">
                    <Image
                      src={p}
                      alt={packageRecord.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(packageRecord.contactEmail || packageRecord.contactPhone) && (
            <div className="mt-8 rounded-lg border border-line bg-white p-4 shadow-soft">
              <h2 className="font-display text-lg font-bold text-ink">Contact the host</h2>
              <div className="mt-2 space-y-1 text-sm text-slate">
                {packageRecord.contactEmail && (
                  <p>
                    Email:{" "}
                    <a
                      href={`mailto:${packageRecord.contactEmail}`}
                      className="text-ink hover:underline"
                    >
                      {packageRecord.contactEmail}
                    </a>
                  </p>
                )}
                {packageRecord.contactPhone && (
                  <p>
                    Phone:{" "}
                    <a
                      href={`tel:${packageRecord.contactPhone}`}
                      className="text-ink hover:underline"
                    >
                      {packageRecord.contactPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PackageBookingForm
            packageId={packageRecord.id}
            pricePerPerson={packageRecord.pricePerPerson}
          />
        </aside>
      </div>
    </div>
  );
}
