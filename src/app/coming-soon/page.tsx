import { ComingSoon } from "@/components/ComingSoon";

export default function ComingSoonPage({
  searchParams,
}: {
  searchParams: { feature?: string };
}) {
  const feature = searchParams.feature?.trim();
  return (
    <ComingSoon
      title={feature || "Coming Soon"}
      message={
        feature
          ? `${feature} isn't available yet — we're still building it out.`
          : "We're putting the finishing touches on this. Check back soon."
      }
    />
  );
}
