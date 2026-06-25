import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HotelForm } from "@/components/HotelForm";

export default function NewHotelPage() {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "SELLER") redirect("/browse");

  return (
    <div className="container-page py-10">
      <Link href="/seller" className="text-sm text-slate transition hover:text-ink">
        ← Back to dashboard
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">New listing</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">
          Add a property
        </h1>
        <p className="mt-2 max-w-prose text-slate">
          Fill in the details and publish. Your listing appears in the marketplace
          for travellers immediately.
        </p>
      </div>
      <div className="mt-8">
        <HotelForm />
      </div>
    </div>
  );
}
