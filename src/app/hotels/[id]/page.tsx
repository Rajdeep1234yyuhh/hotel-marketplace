import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BookingForm } from "@/components/BookingForm";
import { amenitiesToList } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function HotelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: params.id },
    include: { owner: { select: { name: true } } },
  });

  if (!hotel) notFound();

  const session = getSession();
  const amenities = amenitiesToList(hotel.amenities);

  return (
    <div className="container-page py-8">
      <Link
        href="/browse"
        className="text-sm text-slate transition hover:text-ink"
      >
        ← Back to stays
      </Link>

      <div className="mt-4 overflow-hidden rounded-card border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hotel.imageUrl}
          alt={hotel.name}
          className="h-72 w-full object-cover sm:h-96"
        />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow">
            {hotel.city}, {hotel.country}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight text-ink">
            {hotel.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate">
            {hotel.rating > 0 && (
              <span className="font-medium text-ink">★ {hotel.rating.toFixed(1)}</span>
            )}
            <span>Hosted by {hotel.owner.name}</span>
            <span>{hotel.roomsTotal} rooms</span>
          </div>

          <p className="mt-6 max-w-prose leading-relaxed text-ink/90">
            {hotel.description}
          </p>

          {amenities.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">What this place offers</h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {amenities.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingForm
            hotelId={hotel.id}
            pricePerNight={hotel.pricePerNight}
            currency={hotel.currency}
            canBook={session?.role === "BUYER"}
          />
        </aside>
      </div>
    </div>
  );
}
