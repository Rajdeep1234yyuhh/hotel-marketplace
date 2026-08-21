import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findHotelById, roomCategoriesForHotel } from "@/lib/db";
import { getSession, canManageListing } from "@/lib/session";
import { HotelForm } from "@/components/HotelForm";

export default async function SellerEditHotelPage({
  params,
}: {
  params: { id: string };
}) {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "SELLER" && session.role !== "ADMIN") redirect("/browse");

  const hotel = await findHotelById(params.id);
  if (!hotel) notFound();
  if (!(await canManageListing(hotel, session))) redirect("/seller");

  const roomCategories = await roomCategoriesForHotel(hotel.id);

  return (
    <div className="container-page py-10">
      <Link href="/seller" className="text-sm text-slate transition hover:text-ink">
        ← Back to dashboard
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">Host dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Edit {hotel.name}
        </h1>
        <p className="mt-2 max-w-prose text-slate">
          Every field is editable here, same as creating a listing — including room
          categories, location, contact, and payout details.
        </p>
      </div>
      <div className="mt-8">
        <HotelForm
          redirectTo="/seller"
          hotelId={hotel.id}
          initial={{
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            description: hotel.description,
            contactEmail: hotel.contactEmail,
            contactPhone: hotel.contactPhone,
            bankAccountHolder: hotel.bankAccountHolder,
            bankAccountNumber: hotel.bankAccountNumber,
            bankIfsc: hotel.bankIfsc,
            bankName: hotel.bankName,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            coverImage: hotel.coverImage,
            roomCategories: roomCategories.map((rc) => ({
              name: rc.name,
              totalRooms: rc.totalRooms,
              pricePerNight: rc.pricePerNight,
              description: rc.description,
              amenities: rc.amenities,
              mealPlans: rc.mealPlans,
              photos: rc.photos,
            })),
          }}
        />
      </div>
    </div>
  );
}
