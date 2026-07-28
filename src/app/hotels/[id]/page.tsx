import Link from "next/link";
import { notFound } from "next/navigation";
import { findHotelById, findUserById, roomCategoriesForHotel } from "@/lib/db";
import { getSession } from "@/lib/session";
import { BookingForm } from "@/components/BookingForm";
import { formatMoney, mealPlansToList, toList } from "@/lib/validations";

export const dynamic = "force-dynamic";

export default async function HotelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const hotelRecord = findHotelById(params.id);
  if (!hotelRecord) notFound();

  const owner = findUserById(hotelRecord.ownerId);
  const hotel = {
    ...hotelRecord,
    owner: { name: owner?.name ?? "Host" },
    roomCategories: roomCategoriesForHotel(hotelRecord.id),
  };

  const session = getSession();
  const amenities = toList(hotel.amenities);
  const mealPlans = mealPlansToList(hotel.mealPlans);
  const hasCoordinates = hotel.latitude != null && hotel.longitude != null;

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

          {mealPlans.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Meal plans</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {mealPlans.map((plan) => (
                  <span
                    key={plan}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink"
                  >
                    {plan}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hotel.roomCategories.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Room categories</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {hotel.roomCategories.map((rc) => {
                  const photos = toList(rc.photos);
                  return (
                    <div
                      key={rc.id}
                      className="overflow-hidden rounded-card border border-line bg-white"
                    >
                      {photos[0] && (
                        <div className="aspect-[4/3] bg-line">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photos[0]}
                            alt={rc.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-display text-lg text-ink">{rc.name}</h3>
                          <span className="whitespace-nowrap text-sm font-medium text-ink">
                            {formatMoney(rc.pricePerNight, hotel.currency)}
                            <span className="text-xs text-slate"> /night</span>
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate">
                          {rc.totalRooms} {rc.totalRooms === 1 ? "room" : "rooms"} available
                        </p>
                        {rc.description && (
                          <p className="mt-2 text-sm text-ink/80">{rc.description}</p>
                        )}
                        {photos.length > 1 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {photos.slice(1).map((p, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src={p}
                                alt={rc.name}
                                className="h-16 w-24 flex-none rounded-md object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hasCoordinates && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Location</h2>
              <div className="mt-4 overflow-hidden rounded-card border border-line">
                <iframe
                  title={`Map showing ${hotel.name}`}
                  src={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=15&output=embed`}
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-slate underline transition hover:text-ink"
              >
                Open in Google Maps ↗
              </a>
            </div>
          )}

          {(hotel.contactEmail || hotel.contactPhone) && (
            <div className="mt-8 rounded-lg border border-line bg-white p-4">
              <h2 className="font-display text-lg text-ink">Contact the host</h2>
              <div className="mt-2 space-y-1 text-sm text-slate">
                {hotel.contactEmail && (
                  <p>
                    Email:{" "}
                    <a
                      href={`mailto:${hotel.contactEmail}`}
                      className="text-ink hover:underline"
                    >
                      {hotel.contactEmail}
                    </a>
                  </p>
                )}
                {hotel.contactPhone && (
                  <p>
                    Phone:{" "}
                    <a href={`tel:${hotel.contactPhone}`} className="text-ink hover:underline">
                      {hotel.contactPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingForm
            hotelId={hotel.id}
            pricePerNight={hotel.pricePerNight}
            currency={hotel.currency}
            canBook={session?.role === "BUYER"}
            mealPlans={mealPlans}
            roomCategories={hotel.roomCategories.map((rc) => ({
              id: rc.id,
              name: rc.name,
              pricePerNight: rc.pricePerNight,
              totalRooms: rc.totalRooms,
            }))}
          />
        </aside>
      </div>
    </div>
  );
}
