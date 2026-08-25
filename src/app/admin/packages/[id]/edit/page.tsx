import Link from "next/link";
import { notFound } from "next/navigation";
import { findTourPackageById, itineraryForPackage } from "@/lib/db";
import { TourPackageForm } from "@/components/TourPackageForm";

export default async function AdminEditPackagePage({
  params,
}: {
  params: { id: string };
}) {
  const tourPackage = await findTourPackageById(params.id);
  if (!tourPackage) notFound();

  const itinerary = await itineraryForPackage(tourPackage.id);

  return (
    <div>
      <Link href="/admin/packages" className="text-sm text-slate transition hover:text-ink">
        ← Back to tour packages
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">Super admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Edit {tourPackage.title}
        </h1>
        <p className="mt-2 max-w-prose text-slate">
          Every field is editable here, same as creating a listing — including the
          itinerary, pricing, contact, and payout details.
        </p>
      </div>
      <div className="mt-8">
        <TourPackageForm
          redirectTo="/admin/packages"
          packageId={tourPackage.id}
          initial={{
            title: tourPackage.title,
            destination: tourPackage.destination,
            hostedBy: tourPackage.hostedBy,
            description: tourPackage.description,
            durationDays: tourPackage.durationDays,
            durationNights: tourPackage.durationNights,
            pricePerPerson: tourPackage.pricePerPerson,
            coverImage: tourPackage.coverImage,
            photos: tourPackage.photos,
            inclusions: tourPackage.inclusions,
            exclusions: tourPackage.exclusions,
            highlights: tourPackage.highlights,
            contactEmail: tourPackage.contactEmail,
            contactPhone: tourPackage.contactPhone,
            bankAccountHolder: tourPackage.bankAccountHolder,
            bankAccountNumber: tourPackage.bankAccountNumber,
            bankIfsc: tourPackage.bankIfsc,
            bankName: tourPackage.bankName,
            itinerary: itinerary.map((day) => ({
              title: day.title,
              description: day.description,
            })),
          }}
        />
      </div>
    </div>
  );
}
