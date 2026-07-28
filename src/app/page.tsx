import Link from "next/link";
import { redirect } from "next/navigation";
import { EnterForm } from "@/components/EnterForm";
import { getSession } from "@/lib/session";
import { listHotels } from "@/lib/db";

export default async function HomePage() {
  const session = getSession();

  // Returning, signed-in users skip the landing entirely.
  if (session) {
    redirect(session.role === "SELLER" ? "/seller" : "/browse");
  }

  const publishedHotels = listHotels({ published: true });
  const hotelCount = publishedHotels.length;
  const cityCount = new Set(publishedHotels.map((h) => h.city)).size;

  return (
    <div className="bg-gradient-to-br from-ink to-accent-deep">
      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            A two-sided stay marketplace
          </p>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Book a stay,
            <br />
            or open your
            <br />
            <span className="text-sky-300">own front door.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/80">
            Travel Grid India puts travellers and hosts on the same platform. Find a place
            to stay tonight, or list your property and take bookings — you decide
            which side you&apos;re on.
          </p>

          <form
            action="/browse"
            method="get"
            className="mt-8 flex max-w-lg items-center gap-2 rounded-xl bg-white p-2 shadow-lift"
          >
            <svg
              className="ml-2 h-5 w-5 shrink-0 text-slate"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <circle cx="9" cy="9" r="6" />
              <path strokeLinecap="round" d="M18 18l-4.35-4.35" />
            </svg>
            <input
              type="text"
              name="q"
              placeholder="Search by hotel, city or country"
              className="w-full border-0 bg-transparent px-1 py-3 text-sm text-ink placeholder:text-slate/60 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
            >
              Search stays
            </button>
          </form>

          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="text-sm text-white/70">Live listings</dt>
              <dd className="font-display text-3xl font-bold text-white">{hotelCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Destinations</dt>
              <dd className="font-display text-3xl font-bold text-white">{cityCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Setup time</dt>
              <dd className="font-display text-3xl font-bold text-white">2 min</dd>
            </div>
          </dl>

          <p className="mt-8 text-sm text-white/70">
            Just browsing?{" "}
            <Link href="/browse" className="font-semibold text-white underline underline-offset-4">
              See the stays without signing in →
            </Link>
          </p>
        </section>

        <section>
          <EnterForm />
        </section>
      </div>
    </div>
  );
}
