import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findHotelById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { QuickEditHotelForm } from "@/components/QuickEditHotelForm";

export default async function AdminEditHotelPage({
  params,
}: {
  params: { id: string };
}) {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "ADMIN") redirect("/browse");

  const hotel = await findHotelById(params.id);
  if (!hotel) notFound();

  return (
    <div className="container-page py-10">
      <Link href="/admin" className="text-sm text-slate transition hover:text-ink">
        ← Back to admin overview
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">Super admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Edit {hotel.name}
        </h1>
        <p className="mt-2 max-w-prose text-slate">
          Quick edit — name, location, description, and cover photo. Room
          categories are managed by the listing&apos;s owner.
        </p>
      </div>
      <div className="mt-8">
        <QuickEditHotelForm
          hotelId={hotel.id}
          initial={{
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            description: hotel.description,
            coverImage: hotel.coverImage,
          }}
        />
      </div>
    </div>
  );
}
