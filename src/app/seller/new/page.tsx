import Link from "next/link";
import { HotelForm } from "@/components/HotelForm";

export default function NewHotelPage() {
  return (
    <div>
      <Link href="/seller" className="text-sm text-slate transition hover:text-ink">
        ← Back to properties
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">New listing</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
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
