import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findTourPackageById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { QuickEditPackageForm } from "@/components/QuickEditPackageForm";

export default async function AdminEditPackagePage({
  params,
}: {
  params: { id: string };
}) {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "ADMIN") redirect("/browse");

  const tourPackage = await findTourPackageById(params.id);
  if (!tourPackage) notFound();

  return (
    <div className="container-page py-10">
      <Link href="/admin" className="text-sm text-slate transition hover:text-ink">
        ← Back to admin overview
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">Super admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Edit {tourPackage.title}
        </h1>
        <p className="mt-2 max-w-prose text-slate">
          Quick edit — title, destination, description, and cover photo. Itinerary is
          managed by the listing&apos;s owner.
        </p>
      </div>
      <div className="mt-8">
        <QuickEditPackageForm
          packageId={tourPackage.id}
          initial={{
            title: tourPackage.title,
            destination: tourPackage.destination,
            description: tourPackage.description,
            coverImage: tourPackage.coverImage,
          }}
        />
      </div>
    </div>
  );
}
