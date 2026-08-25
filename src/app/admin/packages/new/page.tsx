import Link from "next/link";
import { TourPackageForm } from "@/components/TourPackageForm";

export default function AdminNewPackagePage() {
  return (
    <div>
      <Link href="/admin/packages" className="text-sm text-slate transition hover:text-ink">
        ← Back to tour packages
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <p className="eyebrow">Super admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
          Add a tour package
        </h1>
        <p className="mt-2 max-w-prose text-slate">
          Create a package directly. It&apos;s published immediately and owned by your
          admin account until you reassign it.
        </p>
      </div>
      <div className="mt-8">
        <TourPackageForm redirectTo="/admin/packages" />
      </div>
    </div>
  );
}
