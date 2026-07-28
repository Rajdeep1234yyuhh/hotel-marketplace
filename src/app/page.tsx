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
    <div className="container-page grid items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
      <section>
        <p className="eyebrow">A two-sided stay marketplace</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-ink sm:text-6xl">
          Book a stay,
          <br />
          or open your
          <br />
          <span className="text-brass-deep">own front door.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-slate">
          Travel Grid India puts travellers and hosts on the same platform. Find a place
          to stay tonight, or list your property and take bookings — you decide
          which side you&apos;re on.
        </p>

        <dl className="mt-10 flex gap-10">
          <div>
            <dt className="text-sm text-slate">Live listings</dt>
            <dd className="font-display text-3xl text-ink">{hotelCount}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate">Destinations</dt>
            <dd className="font-display text-3xl text-ink">{cityCount}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate">Setup time</dt>
            <dd className="font-display text-3xl text-ink">2 min</dd>
          </div>
        </dl>

        <p className="mt-8 text-sm text-slate">
          Just browsing?{" "}
          <Link href="/browse" className="font-medium text-ink underline underline-offset-4">
            See the stays without signing in →
          </Link>
        </p>
      </section>

      <section>
        <EnterForm />
      </section>
    </div>
  );
}
