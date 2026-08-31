import Link from "next/link";

export function ComingSoon({
  title = "Coming Soon",
  message = "We're putting the finishing touches on this. Check back soon.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
        <svg
          className="h-6 w-6 text-accent-deep"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <circle cx="12" cy="12" r="8.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5l3.5 2" />
        </svg>
      </span>
      <p className="eyebrow mt-4">Coming soon</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-slate">{message}</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90"
      >
        Back to home
      </Link>
    </div>
  );
}
