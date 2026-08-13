import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TourPackageForm } from "@/components/TourPackageForm";

export default function AdminNewPackagePage() {
  const session = getSession();
  if (!session) redirect("/");
  if (session.role !== "ADMIN") redirect("/browse");

  return (
    <div className="container-page py-10">
      <Link href="/admin" className="text-sm text-slate transition hover:text-ink">
        ← Back to admin overview
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
        <TourPackageForm redirectTo="/admin" />
      </div>
    </div>
  );
}
