"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/validations";
import { prepareImageForUpload } from "@/lib/image-compression";
import {
  ItineraryDayFields,
  emptyItineraryDay,
  type ItineraryDayDraft,
} from "@/components/ItineraryDayFields";

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80";

// Keep in sync with MAX_BYTES in src/app/api/upload/route.ts.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function TourPackageForm({ redirectTo = "/seller" }: { redirectTo?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    destination: "",
    hostedBy: "",
    description: "",
    durationDays: "",
    durationNights: "",
    pricePerPerson: "",
    inclusions: "",
    exclusions: "",
    highlights: "",
    contactEmail: "",
    contactPhone: "",
    bankAccountHolder: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankName: "",
  });
  const [itinerary, setItinerary] = useState<ItineraryDayDraft[]>([{ ...emptyItineraryDay }]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const [coverImage, setCoverImage] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState("");
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState("");
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateDay(index: number, patch: Partial<ItineraryDayDraft>) {
    setItinerary((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addDay() {
    setItinerary((rows) => [...rows, { ...emptyItineraryDay }]);
  }

  function removeDay(index: number) {
    setItinerary((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploadError("");
    setCoverUploading(true);
    try {
      const prepared = await prepareImageForUpload(file);
      if (prepared.size > MAX_UPLOAD_BYTES) {
        throw new Error("That photo is too large even after compression — try a smaller one.");
      }
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setCoverImage(data.url);
    } catch (err) {
      setCoverUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setCoverUploading(false);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  }

  async function handleGalleryFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setGalleryUploadError("");
    setGalleryUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const prepared = await prepareImageForUpload(file);
        if (prepared.size > MAX_UPLOAD_BYTES) {
          throw new Error(
            `"${file.name}" is too large even after compression — try a smaller photo.`
          );
        }
        const fd = new FormData();
        fd.append("file", prepared);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        uploaded.push(data.url);
      }
      setPhotos((p) => [...p, ...uploaded]);
    } catch (err) {
      setGalleryUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setGalleryUploading(false);
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, pi) => pi !== i));
  }

  async function submit() {
    setErrors({});

    const namedDays = itinerary.filter((d) => d.title.trim());
    if (namedDays.length === 0) {
      setErrors({ _: ["Add at least one itinerary day."] });
      return;
    }
    if (!coverImage) {
      setErrors({ coverImage: ["Add a cover photo"] });
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        coverImage,
        photos: photos.join(","),
        itinerary: namedDays.map((d, i) => ({
          dayNumber: i + 1,
          title: d.title,
          description: d.description,
        })),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(typeof data.error === "object" ? data.error : { _: [String(data.error)] });
      setSubmitting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  const previewImage = coverImage || SAMPLE_IMAGE;
  const previewPrice = Number(form.pricePerPerson);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-5">
        <div>
          <label htmlFor="title" className="field-label">
            Package title
          </label>
          <input
            id="title"
            className="field-input"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Enchanting Kerala Backwaters"
          />
          {errors.title && <p className="field-error">{errors.title[0]}</p>}
        </div>

        <div>
          <label htmlFor="destination" className="field-label">
            Destination
          </label>
          <input
            id="destination"
            className="field-input"
            value={form.destination}
            onChange={(e) => update("destination", e.target.value)}
            placeholder="Kochi, Munnar & Alleppey"
          />
          {errors.destination && <p className="field-error">{errors.destination[0]}</p>}
        </div>

        <div>
          <label htmlFor="hostedBy" className="field-label">
            Hosted by
          </label>
          <input
            id="hostedBy"
            className="field-input"
            value={form.hostedBy}
            onChange={(e) => update("hostedBy", e.target.value)}
            placeholder="Kerala Backwater Tours"
          />
          <p className="mt-1 text-xs text-slate">
            The agency or host name shown to travellers on this package.
          </p>
          {errors.hostedBy && <p className="field-error">{errors.hostedBy[0]}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="durationDays" className="field-label">
              Days
            </label>
            <input
              id="durationDays"
              type="number"
              min={1}
              className="field-input"
              value={form.durationDays}
              onChange={(e) => update("durationDays", e.target.value)}
              placeholder="5"
            />
            {errors.durationDays && <p className="field-error">{errors.durationDays[0]}</p>}
          </div>
          <div>
            <label htmlFor="durationNights" className="field-label">
              Nights
            </label>
            <input
              id="durationNights"
              type="number"
              min={0}
              className="field-input"
              value={form.durationNights}
              onChange={(e) => update("durationNights", e.target.value)}
              placeholder="4"
            />
            {errors.durationNights && <p className="field-error">{errors.durationNights[0]}</p>}
          </div>
          <div>
            <label htmlFor="pricePerPerson" className="field-label">
              Price / person
            </label>
            <input
              id="pricePerPerson"
              type="number"
              min={1}
              className="field-input"
              value={form.pricePerPerson}
              onChange={(e) => update("pricePerPerson", e.target.value)}
              placeholder="18500"
            />
            {errors.pricePerPerson && <p className="field-error">{errors.pricePerPerson[0]}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="field-label">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="field-input resize-none"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Tell travellers what makes this trip special."
          />
          {errors.description && <p className="field-error">{errors.description[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="inclusions" className="field-label">
              Inclusions <span className="text-slate">(comma separated)</span>
            </label>
            <input
              id="inclusions"
              className="field-input"
              value={form.inclusions}
              onChange={(e) => update("inclusions", e.target.value)}
              placeholder="Hotel stay, Breakfast, Airport transfers"
            />
          </div>
          <div>
            <label htmlFor="exclusions" className="field-label">
              Exclusions <span className="text-slate">(comma separated)</span>
            </label>
            <input
              id="exclusions"
              className="field-input"
              value={form.exclusions}
              onChange={(e) => update("exclusions", e.target.value)}
              placeholder="Flights, Personal expenses"
            />
          </div>
        </div>

        <div>
          <label htmlFor="highlights" className="field-label">
            Highlights <span className="text-slate">(comma separated)</span>
          </label>
          <input
            id="highlights"
            className="field-input"
            value={form.highlights}
            onChange={(e) => update("highlights", e.target.value)}
            placeholder="Houseboat stay, Tea garden trek, Sunset cruise"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="field-label mb-0">Cover photo</span>
          </div>

          {coverImage ? (
            <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage("")}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                ref={coverFileInputRef}
                id="coverImageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleCoverFileChange}
              />
              <label
                htmlFor="coverImageFile"
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  coverUploading
                    ? "border-line bg-line/40 cursor-wait"
                    : "border-line hover:border-ink/30 hover:bg-line/30"
                }`}
              >
                {coverUploading ? (
                  <span className="text-sm text-slate">Uploading…</span>
                ) : (
                  <>
                    <svg className="h-8 w-8 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-slate">
                      Click to upload <span className="font-medium text-ink">or drag and drop</span>
                    </span>
                    <span className="text-xs text-slate">JPEG, PNG, WebP, GIF · max 5 MB</span>
                  </>
                )}
              </label>
            </>
          )}
          {coverUploadError && <p className="field-error mt-1">{coverUploadError}</p>}
          {errors.coverImage && <p className="field-error mt-1">{errors.coverImage[0]}</p>}
        </div>

        {/* Gallery photos */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="field-label mb-0">Gallery photos</span>
            {photos.length > 0 && <span className="text-xs text-slate">{photos.length} added</span>}
          </div>
          <input
            ref={galleryFileInputRef}
            id="galleryFiles"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleGalleryFilesChange}
          />
          <label
            htmlFor="galleryFiles"
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
              galleryUploading
                ? "border-line bg-line/40 cursor-wait"
                : "border-line hover:border-ink/30 hover:bg-line/30"
            }`}
          >
            {galleryUploading ? (
              <span className="text-sm text-slate">Uploading…</span>
            ) : (
              <span className="text-sm text-slate">
                Click to upload <span className="font-medium text-ink">or drag and drop</span>
              </span>
            )}
          </label>
          {galleryUploadError && <p className="field-error mt-1">{galleryUploadError}</p>}

          {photos.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {photos.map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-md border border-line bg-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Itinerary */}
        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <p className="field-label mb-0">Itinerary</p>
            <button
              type="button"
              onClick={addDay}
              className="text-xs font-medium text-accent-deep hover:underline"
            >
              + Add day
            </button>
          </div>
          <p className="mt-1 text-xs text-slate">
            Day-by-day plan travellers see on the package page. Leave the title blank to skip
            a row. At least one day is required to publish.
          </p>

          <div className="mt-3 space-y-3">
            {itinerary.map((row, i) => (
              <ItineraryDayFields
                key={i}
                dayNumber={i + 1}
                draft={row}
                onChange={(patch) => updateDay(i, patch)}
                onRemove={() => removeDay(i)}
                canRemove={itinerary.length > 1}
              />
            ))}
          </div>
        </div>

        {/* Contact details */}
        <div className="border-t border-line pt-5">
          <p className="field-label mb-3">Package contact details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactEmail" className="field-label">
                Contact email
              </label>
              <input
                id="contactEmail"
                type="email"
                className="field-input"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                placeholder="tours@yourcompany.com"
              />
              {errors.contactEmail && <p className="field-error">{errors.contactEmail[0]}</p>}
            </div>
            <div>
              <label htmlFor="contactPhone" className="field-label">
                Contact number
              </label>
              <input
                id="contactPhone"
                type="tel"
                className="field-input"
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="+91 98765 43210"
              />
              {errors.contactPhone && <p className="field-error">{errors.contactPhone[0]}</p>}
            </div>
          </div>
        </div>

        {/* Bank / payout details */}
        <div className="border-t border-line pt-5">
          <p className="field-label mb-1">Payout bank details</p>
          <p className="mb-3 text-xs text-slate">
            Kept private — only you and marketplace admins can see this.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="bankAccountHolder" className="field-label">
                Account holder name
              </label>
              <input
                id="bankAccountHolder"
                className="field-input"
                value={form.bankAccountHolder}
                onChange={(e) => update("bankAccountHolder", e.target.value)}
                placeholder="As per bank records"
              />
              {errors.bankAccountHolder && (
                <p className="field-error">{errors.bankAccountHolder[0]}</p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="bankName" className="field-label">
                Bank name
              </label>
              <input
                id="bankName"
                className="field-input"
                value={form.bankName}
                onChange={(e) => update("bankName", e.target.value)}
                placeholder="HDFC Bank"
              />
              {errors.bankName && <p className="field-error">{errors.bankName[0]}</p>}
            </div>
            <div>
              <label htmlFor="bankAccountNumber" className="field-label">
                Account number
              </label>
              <input
                id="bankAccountNumber"
                className="field-input"
                value={form.bankAccountNumber}
                onChange={(e) => update("bankAccountNumber", e.target.value)}
                placeholder="000123456789"
              />
              {errors.bankAccountNumber && (
                <p className="field-error">{errors.bankAccountNumber[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="bankIfsc" className="field-label">
                IFSC / bank code
              </label>
              <input
                id="bankIfsc"
                className="field-input"
                value={form.bankIfsc}
                onChange={(e) => update("bankIfsc", e.target.value)}
                placeholder="HDFC0001234"
              />
              {errors.bankIfsc && <p className="field-error">{errors.bankIfsc[0]}</p>}
            </div>
          </div>
        </div>

        {errors._ && <p className="field-error">{errors._[0]}</p>}

        <div className="flex gap-3 pt-2">
          <Button onClick={submit} disabled={submitting} variant="secondary">
            {submitting ? "Publishing…" : "Publish package"}
          </Button>
          <Button variant="ghost" onClick={() => router.push(redirectTo)} type="button">
            Cancel
          </Button>
        </div>
      </div>

      {/* Live preview mirrors the marketplace card. */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow mb-3">Live preview</p>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          <div className="aspect-[4/3] bg-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
          </div>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider text-slate">
              {form.destination || "Destination"}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink">
              {form.title || "Your package title"}
            </h3>
            <p className="mt-1 text-xs text-slate">
              {form.durationDays || "—"} Days / {form.durationNights || "—"} Nights
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-lg font-semibold text-ink">
                {previewPrice > 0 ? formatMoney(previewPrice) : "—"}
              </span>
              <span className="text-sm text-slate">/ person</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
