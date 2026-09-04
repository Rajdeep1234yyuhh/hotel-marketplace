import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listHotels, listTourPackages, roomCategoriesForHotel } from "@/lib/db";
import { HeroSearchWidget } from "@/components/HeroSearchWidget";
import { HotelCard } from "@/components/HotelCard";
import { TourPackageCard } from "@/components/TourPackageCard";
import { HostPartnerCard } from "@/components/HostPartnerCard";
import { isFeaturedHotel } from "@/lib/featured-hotels";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&q=80";

const TRUST_POINTS = [
  {
    label: "Best Price Guarantee",
    sub: "Get the best deals",
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
    sub: "Flexible & easy",
    icon: (
      <>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" strokeLinecap="round" />
        <path strokeLinecap="round" d="M3.5 9h17M8 3v3M16 3v3" />
      </>
    ),
  },
  {
    label: "24/7 Customer Support",
    sub: "We're here for you",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12a8 8 0 0116 0v5a2 2 0 01-2 2h-1v-6h3M4 17v-5h3v6H5a1 1 0 01-1-1z"
      />
    ),
  },
  {
    label: "Trusted & Verified Stays",
    sub: "Safe and reliable",
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
    redirect(
      session.role === "ADMIN" ? "/admin" : session.role === "SELLER" ? "/seller" : "/browse"
    );
  }

  const [publishedHotels, publishedPackages] = await Promise.all([
    listHotels({ published: true }),
    listTourPackages({ published: true }),
  ]);
  const featuredHotelRecords = publishedHotels.filter((h) => isFeaturedHotel(h.id));
  const featuredHotels = await Promise.all(
    featuredHotelRecords.map(async (h) => {
      const categories = await roomCategoriesForHotel(h.id);
      const prices = categories.map((c) => c.pricePerNight);
      return { ...h, startingPrice: prices.length > 0 ? Math.min(...prices) : 0 };
    })
  );
  const featuredPackages = publishedPackages.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[520px] items-center overflow-hidden sm:min-h-[560px]">
        <Image
          src={HERO_IMAGE}
          alt="Hills of Northeast India"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/35 to-ink/10" />

        <div className="container-page relative w-full py-16">
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Explore Northeast India
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Discover and book the best hotels, homestays, resorts and unique stays across
            Northeast India.
          </p>

          <div className="mt-8 max-w-3xl">
            <HeroSearchWidget />
          </div>
        </div>
      </section>

      <div className="container-page">
        {/* Tour packages */}
        {featuredPackages.length > 0 && (
          <section className="border-b border-line py-10">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold text-ink">Explore tour packages</h2>
              <Link
                href="/packages"
                className="text-sm font-medium text-accent-deep hover:underline"
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

        {/* Popular stays */}
        {featuredHotels.length > 0 && (
          <section className="border-b border-line py-10">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold text-ink">Popular stays</h2>
              <Link
                href="/coming-soon?feature=All%20stays"
                className="text-sm font-medium text-accent-deep hover:underline"
              >
                View all stays →
              </Link>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} href={`/hotels/${hotel.id}`} />
              ))}
            </div>
          </section>
        )}

        {/* Host CTA */}
        <section id="get-started" className="py-10">
          <HostPartnerCard />
        </section>

        {/* Trust badges */}
        <section className="grid grid-cols-2 gap-6 border-t border-line py-10 sm:grid-cols-4">
          {TRUST_POINTS.map((t) => (
            <div key={t.label} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <svg
                  className="h-4.5 w-4.5 text-accent-deep"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  {t.icon}
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{t.label}</p>
                <p className="text-xs text-slate">{t.sub}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
