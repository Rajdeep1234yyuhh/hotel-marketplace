import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TourPackageForm } from "@/components/TourPackageForm";

export default function NewPackagePage() {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "SELLER" && session.role !== "ADMIN") redirect("/browse");

  return (
    <div className="container-page py-10">
      <Link href="/seller" className="text-sm text-slate transition hover:text-ink">
        ← Back to dashboard
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
        <TourPackageForm />
      </div>
    </div>
  );
}
