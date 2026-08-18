"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney, toList } from "@/lib/validations";
import { prepareImageForUpload } from "@/lib/image-compression";
import {
  RoomCategoryFields,
  emptyRoomCategory,
  type RoomCategoryDraft,
} from "@/components/RoomCategoryFields";

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80";

// Keep in sync with MAX_BYTES in src/app/api/upload/route.ts.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type HotelFormInitial = {
  name: string;
  city: string;
  country: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  latitude: number | null;
  longitude: number | null;
  coverImage: string;
  roomCategories: {
    name: string;
    totalRooms: number;
    pricePerNight: number;
    description: string;
    amenities: string;
    mealPlans: string;
    photos: string;
  }[];
};

type Props = {
  redirectTo?: string;
  hotelId?: string;
  initial?: HotelFormInitial;
};

export function HotelForm({ redirectTo = "/seller", hotelId, initial }: Props) {
  const isEdit = Boolean(hotelId && initial);
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    country: initial?.country ?? "India",
    description: initial?.description ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactPhone: initial?.contactPhone ?? "",
    bankAccountHolder: initial?.bankAccountHolder ?? "",
    bankAccountNumber: initial?.bankAccountNumber ?? "",
    bankIfsc: initial?.bankIfsc ?? "",
    bankName: initial?.bankName ?? "",
    latitude: initial?.latitude != null ? String(initial.latitude) : "",
    longitude: initial?.longitude != null ? String(initial.longitude) : "",
  });
  const [roomCategories, setRoomCategories] = useState<RoomCategoryDraft[]>(
    initial && initial.roomCategories.length > 0
      ? initial.roomCategories.map((rc) => ({
          name: rc.name,
          totalRooms: String(rc.totalRooms),
          pricePerNight: String(rc.pricePerNight),
          description: rc.description,
          amenities: rc.amenities,
          mealPlans: rc.mealPlans,
          photos: toList(rc.photos),
        }))
      : [{ ...emptyRoomCategory }]
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState("");
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [mapLink, setMapLink] = useState("");
  const [mapLinkError, setMapLinkError] = useState("");
  const [locating, setLocating] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateRoomCategory(index: number, patch: Partial<RoomCategoryDraft>) {
    setRoomCategories((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function addRoomCategory() {
    // New category goes on top, so it's immediately visible.
    setRoomCategories((rows) => [{ ...emptyRoomCategory }, ...rows]);
  }

  function removeRoomCategory(index: number) {
    setRoomCategories((rows) => rows.filter((_, i) => i !== index));
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

  async function locateFromLink() {
    const link = mapLink.trim();
    if (!link) return;
    setMapLinkError("");
    setLocating(true);
    try {
      const res = await fetch("/api/resolve-map-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't find a location in that link");
      update("latitude", String(data.latitude));
      update("longitude", String(data.longitude));
    } catch (err) {
      setMapLinkError(
        err instanceof Error ? err.message : "Couldn't find a location in that link"
      );
    }
    setLocating(false);
  }

  function clearLocation() {
    update("latitude", "");
    update("longitude", "");
    setMapLink("");
    setMapLinkError("");
  }

  async function submit() {
    setErrors({});

    const namedRows = roomCategories.filter((r) => r.name.trim());
    if (namedRows.length === 0) {
      setErrors({ _: ["Add at least one room category."] });
      return;
    }
    const incomplete = namedRows.find((r) => !r.pricePerNight.trim());
    if (incomplete) {
      setErrors({
        _: [`Add a price per night for “${incomplete.name.trim()}”.`],
      });
      return;
    }
    if (!coverImage) {
      setErrors({ coverImage: ["Add a cover photo"] });
      return;
    }

    setSubmitting(true);
    const res = await fetch(isEdit ? `/api/hotels/${hotelId}` : "/api/hotels", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        coverImage,
        roomCategories: namedRows.map((r) => ({
          name: r.name,
          totalRooms: r.totalRooms || "1",
          pricePerNight: r.pricePerNight,
          description: r.description,
          amenities: r.amenities,
          mealPlans: r.mealPlans,
          photos: r.photos.join(","),
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
  const previewPrices = roomCategories
    .filter((r) => r.name.trim() && r.pricePerNight.trim())
    .map((r) => Number(r.pricePerNight))
    .filter((n) => Number.isFinite(n) && n > 0);
  const previewPrice = previewPrices.length > 0 ? Math.min(...previewPrices) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="field-label">
            Property name
          </label>
          <input
            id="name"
            className="field-input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="The Brahmaputra Verandah"
          />
          {errors.name && <p className="field-error">{errors.name[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="field-label">
              City
            </label>
            <input
              id="city"
              className="field-input"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Guwahati"
            />
            {errors.city && <p className="field-error">{errors.city[0]}</p>}
          </div>
          <div>
            <label htmlFor="country" className="field-label">
              Country
            </label>
            <input
              id="country"
              className="field-input"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
            {errors.country && <p className="field-error">{errors.country[0]}</p>}
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
            placeholder="Tell guests what makes this place special."
          />
          {errors.description && <p className="field-error">{errors.description[0]}</p>}
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

        {/* Location */}
        <div className="border-t border-line pt-5">
          <p className="field-label mb-1">Location</p>
          {form.latitude && form.longitude ? (
            <div>
              <div className="overflow-hidden rounded-lg border border-line">
                <iframe
                  title="Selected location"
                  src={`https://www.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`}
                  className="h-48 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate">
                <span>
                  Pinned at {Number(form.latitude).toFixed(4)},{" "}
                  {Number(form.longitude).toFixed(4)}
                </span>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="font-medium text-accent-deep hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-2 text-xs text-slate">
                Optional — open your property in{" "}
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-ink"
                >
                  Google Maps
                </a>
                , drop a pin on it, tap <span className="font-medium text-ink">Share</span>, and
                paste the link here.
              </p>
              <div className="flex gap-2">
                <input
                  className="field-input"
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      locateFromLink();
                    }
                  }}
                  placeholder="https://maps.app.goo.gl/…"
                />
                <button
                  type="button"
                  onClick={locateFromLink}
                  disabled={locating || !mapLink.trim()}
                  className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-ink/40 disabled:opacity-50"
                >
                  {locating ? "Locating…" : "Drop pin"}
                </button>
              </div>
              {mapLinkError && <p className="field-error mt-1">{mapLinkError}</p>}
              {(errors.latitude || errors.longitude) && (
                <p className="field-error mt-1">
                  {errors.latitude?.[0] ?? errors.longitude?.[0]}
                </p>
              )}
            </>
          )}
        </div>

        {/* Room categories */}
        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <p className="field-label mb-0">Room categories</p>
            <button
              type="button"
              onClick={addRoomCategory}
              className="text-xs font-medium text-accent-deep hover:underline"
            >
              + Add category
            </button>
          </div>
          <p className="mt-1 text-xs text-slate">
            Each category has its own price, photos, amenities, and meal plans. Leave the
            name blank to skip a row. At least one is required to publish.
          </p>

          <div className="mt-3 space-y-4">
            {roomCategories.map((row, i) => (
              <RoomCategoryFields
                key={i}
                draft={row}
                onChange={(patch) => updateRoomCategory(i, patch)}
                onRemove={() => removeRoomCategory(i)}
                canRemove={roomCategories.length > 1}
                fileInputId={`roomCategoryFiles-${i}`}
              />
            ))}
          </div>
        </div>

        {/* Contact details */}
        <div className="border-t border-line pt-5">
          <p className="field-label mb-3">Hotel contact details</p>
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
                placeholder="stay@yourhotel.com"
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
            {isEdit
              ? submitting
                ? "Saving…"
                : "Save changes"
              : submitting
              ? "Publishing…"
              : "Publish listing"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(redirectTo)}
            type="button"
          >
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
            <img
              src={previewImage}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider text-slate">
              {form.city || "City"}, {form.country || "Country"}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink">
              {form.name || "Your property name"}
            </h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-lg font-semibold text-ink">
                {previewPrice > 0 ? formatMoney(previewPrice) : "—"}
              </span>
              <span className="text-sm text-slate">/ night</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
