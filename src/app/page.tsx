import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listHotels, listTourPackages, roomCategoriesForHotel } from "@/lib/db";
import { HeroSearchWidget } from "@/components/HeroSearchWidget";
import { DestinationCard } from "@/components/DestinationCard";
import { HotelCard } from "@/components/HotelCard";
import { TourPackageCard } from "@/components/TourPackageCard";
import { EnterForm } from "@/components/EnterForm";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&q=80";

const TRUST_POINTS = [
  {
    label: "Best Price Guarantee",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
      />
    ),
  },
  {
    label: "Free Cancellation",
    icon: (
      <>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" strokeLinecap="round" />
        <path strokeLinecap="round" d="M3.5 9h17M8 3v3M16 3v3" />
      </>
    ),
  },
  {
    label: "24/7 Customer Support",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 12a8 8 0 0116 0v5a2 2 0 01-2 2h-1v-6h3M4 17v-5h3v6H5a1 1 0 01-1-1z"
        />
      </>
    ),
  },
  {
    label: "Trusted & Verified Stays",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </>
    ),
  },
];

export default async function HomePage() {
  const session = getSession();

  // Returning, signed-in users skip the landing entirely.
  if (session) {
    redirect(session.role === "SELLER" ? "/seller" : "/browse");
  }

  const [publishedHotels, publishedPackages] = await Promise.all([
    listHotels({ published: true }),
    listTourPackages({ published: true }),
  ]);

  const hotels = await Promise.all(
    publishedHotels.map(async (h) => {
      const categories = await roomCategoriesForHotel(h.id);
      const prices = categories.map((c) => c.pricePerNight);
      return { ...h, startingPrice: prices.length > 0 ? Math.min(...prices) : 0 };
    })
  );

  const cityCount = new Set(hotels.map((h) => h.city)).size;

  const destinations = Object.values(
    hotels.reduce<Record<string, { city: string; country: string; coverImage: string; listingCount: number }>>(
      (acc, h) => {
        const key = h.city;
        if (!acc[key]) {
          acc[key] = { city: h.city, country: h.country, coverImage: h.coverImage, listingCount: 0 };
        }
        acc[key].listingCount += 1;
        return acc;
      },
      {}
    )
  )
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 6);

  const popularStays = hotels.slice(0, 6);
  const featuredPackages = publishedPackages.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden sm:min-h-[620px]">
        <Image
          src={HERO_IMAGE}
          alt="Hills of Northeast India"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/10" />

        <div className="container-page relative w-full py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            Your gateway to
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Northeast India
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Discover and book the best hotels, homestays, resorts and unique stays across
            Northeast India.
          </p>

          <div className="mt-8 max-w-2xl">
            <HeroSearchWidget />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {TRUST_POINTS.map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-sm text-white/90">
                <svg
                  className="h-5 w-5 shrink-0 text-sky-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  {t.icon}
                </svg>
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page">
        {/* Destinations */}
        {destinations.length > 0 && (
          <section className="border-b border-line py-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  Explore Northeast India
                </h2>
                <p className="mt-1 text-sm text-slate">Popular destinations</p>
              </div>
              <Link
                href="/browse"
                className="hidden text-sm font-medium text-accent-deep hover:underline sm:inline-block"
              >
                View all destinations →
              </Link>
            </div>
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {destinations.map((d) => (
                <DestinationCard
                  key={d.city}
                  city={d.city}
                  country={d.country}
                  coverImage={d.coverImage}
                  listingCount={d.listingCount}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular stays */}
        {popularStays.length > 0 && (
          <section className="border-b border-line py-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Popular stays</h2>
                <p className="mt-1 text-sm text-slate">Handpicked stays for your next trip</p>
              </div>
              <Link
                href="/browse"
                className="hidden text-sm font-medium text-accent-deep hover:underline sm:inline-block"
              >
                View all stays →
              </Link>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularStays.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} href={`/hotels/${hotel.id}`} />
              ))}
            </div>
          </section>
        )}

        {/* Tour packages */}
        {featuredPackages.length > 0 && (
          <section className="border-b border-line py-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  Explore tour packages
                </h2>
                <p className="mt-1 text-sm text-slate">
                  Curated packages to experience the best of the Northeast
                </p>
              </div>
              <Link
                href="/packages"
                className="hidden text-sm font-medium text-accent-deep hover:underline sm:inline-block"
              >
                View all packages →
              </Link>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredPackages.map((p) => (
                <TourPackageCard key={p.id} tourPackage={p} href={`/packages/${p.id}`} />
              ))}
            </div>
          </section>
        )}

        {/* Stats + host CTA */}
        <section id="get-started" className="grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Why book with Travel Grid India?</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              List your property with us
            </h2>
            <p className="mt-3 max-w-md text-slate">
              Free listing, low commission, and more direct bookings — sign in with Google
              and your host dashboard is ready in minutes.
            </p>
            <dl className="mt-8 flex gap-10">
              <div>
                <dt className="text-sm text-slate">Live listings</dt>
                <dd className="font-display text-3xl font-bold text-ink">{hotels.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Destinations</dt>
                <dd className="font-display text-3xl font-bold text-ink">{cityCount}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Setup time</dt>
                <dd className="font-display text-3xl font-bold text-ink">2 min</dd>
              </div>
            </dl>
            <p className="mt-8 text-sm text-slate">
              Just browsing?{" "}
              <Link href="/browse" className="font-semibold text-ink underline underline-offset-4">
                See the stays without signing in →
              </Link>
            </p>
          </div>
          <EnterForm />
        </section>
      </div>
    </div>
  );
}
