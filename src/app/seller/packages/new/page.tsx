import Link from "next/link";
import { TourPackageForm } from "@/components/TourPackageForm";

export default function NewPackagePage() {
  return (
    <div>
      <Link href="/seller/packages" className="text-sm text-slate transition hover:text-ink">
        ← Back to tour packages
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">New tour package</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Add a tour package
        </h1>
        <p className="mt-2 max-w-prose text-slate">
          Fill in the itinerary and publish. Your package appears in the marketplace for
          travellers immediately.
        </p>
      </div>
      <div className="mt-8">
        <TourPackageForm redirectTo="/seller/packages" />
      </div>
    </div>
  );
}
