import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-slate">The stay you&apos;re looking for may have been removed.</p>
      <Link
        href="/browse"
        className="mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper"
      >
        Browse stays
      </Link>
    </div>
  );
}
