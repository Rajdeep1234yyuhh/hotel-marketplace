"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/validations";

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80";

const MEAL_PLAN_SUGGESTIONS = [
  "Room Only",
  "Breakfast Included",
  "Half Board",
  "Full Board",
];

type RoomCategoryDraft = {
  name: string;
  totalRooms: string;
  pricePerNight: string;
  description: string;
  photos: string;
};

const emptyRoomCategory: RoomCategoryDraft = {
  name: "",
  totalRooms: "",
  pricePerNight: "",
  description: "",
  photos: "",
};

export function HotelForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "India",
    description: "",
    pricePerNight: "",
    currency: "INR",
    imageUrl: "",
    amenities: "",
    roomsTotal: "1",
    contactEmail: "",
    contactPhone: "",
    bankAccountHolder: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankName: "",
    latitude: "",
    longitude: "",
    mealPlans: "",
  });
  const [roomCategories, setRoomCategories] = useState<RoomCategoryDraft[]>([
    { ...emptyRoomCategory },
  ]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateRoomCategory(
    index: number,
    key: keyof RoomCategoryDraft,
    value: string
  ) {
    setRoomCategories((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  function addRoomCategory() {
    setRoomCategories((rows) => [...rows, { ...emptyRoomCategory }]);
  }

  function removeRoomCategory(index: number) {
    setRoomCategories((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    update("imageUrl", "");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      update("imageUrl", data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    setErrors({});

    // Only rows where a name was entered count as a real category. Any such
    // row must have a price — validate client-side before hitting the API.
    const namedRows = roomCategories.filter((r) => r.name.trim());
    const incomplete = namedRows.find((r) => !r.pricePerNight.trim());
    if (incomplete) {
      setErrors({
        _: [`Add a price per night for “${incomplete.name.trim()}”.`],
      });
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/hotels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        roomCategories: namedRows.map((r) => ({
          name: r.name,
          totalRooms: r.totalRooms || "1",
          pricePerNight: r.pricePerNight,
          description: r.description,
          photos: r.photos,
        })),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(typeof data.error === "object" ? data.error : { _: [String(data.error)] });
      setSubmitting(false);
      return;
    }

    router.push("/seller");
    router.refresh();
  }

  const previewImage = form.imageUrl.trim() || SAMPLE_IMAGE;
  const priceNumber = Number(form.pricePerNight) || 0;

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

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="price" className="field-label">
              Price / night
            </label>
            <input
              id="price"
              type="number"
              min={1}
              className="field-input"
              value={form.pricePerNight}
              onChange={(e) => update("pricePerNight", e.target.value)}
              placeholder="6200"
            />
            {errors.pricePerNight && (
              <p className="field-error">{errors.pricePerNight[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="currency" className="field-label">
              Currency
            </label>
            <select
              id="currency"
              className="field-input"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label htmlFor="rooms" className="field-label">
              Rooms
            </label>
            <input
              id="rooms"
              type="number"
              min={1}
              className="field-input"
              value={form.roomsTotal}
              onChange={(e) => update("roomsTotal", e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1">
            <span className="field-label mb-0">Photo</span>
            <div className="ml-auto flex rounded-md border border-line text-xs">
              <button
                type="button"
                onClick={() => { setImageMode("upload"); setUploadError(""); }}
                className={`rounded-l-md px-3 py-1 transition-colors ${
                  imageMode === "upload"
                    ? "bg-ink text-white"
                    : "text-slate hover:bg-line"
                }`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => { setImageMode("url"); setUploadError(""); }}
                className={`rounded-r-md px-3 py-1 transition-colors ${
                  imageMode === "url"
                    ? "bg-ink text-white"
                    : "text-slate hover:bg-line"
                }`}
              >
                URL
              </button>
            </div>
          </div>

          {imageMode === "upload" ? (
            <div>
              <input
                ref={fileInputRef}
                id="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleFileChange}
              />
              <label
                htmlFor="imageFile"
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  uploading
                    ? "border-line bg-line/40 cursor-wait"
                    : form.imageUrl
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-line hover:border-ink/30 hover:bg-line/30"
                }`}
              >
                {uploading ? (
                  <span className="text-sm text-slate">Uploading…</span>
                ) : form.imageUrl ? (
                  <>
                    <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-emerald-700">Image uploaded — click to replace</span>
                  </>
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
              {uploadError && <p className="field-error mt-1">{uploadError}</p>}
            </div>
          ) : (
            <input
              id="imageUrl"
              className="field-input"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://…"
            />
          )}
          {errors.imageUrl && <p className="field-error">{errors.imageUrl[0]}</p>}
        </div>

        <div>
          <label htmlFor="amenities" className="field-label">
            Amenities <span className="text-slate">(comma separated)</span>
          </label>
          <input
            id="amenities"
            className="field-input"
            value={form.amenities}
            onChange={(e) => update("amenities", e.target.value)}
            placeholder="River view, Breakfast included, Free Wi-Fi"
          />
        </div>

        <div>
          <label htmlFor="mealPlans" className="field-label">
            Meal plans <span className="text-slate">(comma separated)</span>
          </label>
          <input
            id="mealPlans"
            className="field-input"
            value={form.mealPlans}
            onChange={(e) => update("mealPlans", e.target.value)}
            placeholder={MEAL_PLAN_SUGGESTIONS.join(", ")}
          />
          <p className="mt-1 text-xs text-slate">
            Guests choose one of these at booking. Suggestions: {MEAL_PLAN_SUGGESTIONS.join(", ")}.
          </p>
          {errors.mealPlans && <p className="field-error">{errors.mealPlans[0]}</p>}
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
            Break your inventory into categories (e.g. Deluxe, Suite) with their own
            room count, price, and photos. Leave the name blank to skip a row.
          </p>

          <div className="mt-3 space-y-4">
            {roomCategories.map((row, i) => (
              <div key={i} className="rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="field-label">Category name</label>
                      <input
                        className="field-input"
                        value={row.name}
                        onChange={(e) => updateRoomCategory(i, "name", e.target.value)}
                        placeholder="Deluxe Room"
                      />
                    </div>
                    <div>
                      <label className="field-label">Rooms in this category</label>
                      <input
                        type="number"
                        min={1}
                        className="field-input"
                        value={row.totalRooms}
                        onChange={(e) => updateRoomCategory(i, "totalRooms", e.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="field-label">Price / night</label>
                      <input
                        type="number"
                        min={1}
                        className="field-input"
                        value={row.pricePerNight}
                        onChange={(e) => updateRoomCategory(i, "pricePerNight", e.target.value)}
                        placeholder="6200"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="field-label">Description</label>
                      <input
                        className="field-input"
                        value={row.description}
                        onChange={(e) => updateRoomCategory(i, "description", e.target.value)}
                        placeholder="What makes this room category different"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="field-label">
                        Photos <span className="text-slate">(comma separated URLs)</span>
                      </label>
                      <input
                        className="field-input"
                        value={row.photos}
                        onChange={(e) => updateRoomCategory(i, "photos", e.target.value)}
                        placeholder="https://…, https://…"
                      />
                    </div>
                  </div>
                  {roomCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoomCategory(i)}
                      className="mt-6 text-xs font-medium text-slate hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="border-t border-line pt-5">
          <p className="field-label mb-1">Location & Google Maps</p>
          <p className="mb-3 text-xs text-slate">
            Optional — add coordinates so guests see a map on the listing. Find them by
            right-clicking your property in{" "}
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-ink"
            >
              Google Maps
            </a>{" "}
            and copying the numbers shown.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="field-label">
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                className="field-input"
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                placeholder="26.1445"
              />
              {errors.latitude && <p className="field-error">{errors.latitude[0]}</p>}
            </div>
            <div>
              <label htmlFor="longitude" className="field-label">
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                className="field-input"
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                placeholder="91.7362"
              />
              {errors.longitude && <p className="field-error">{errors.longitude[0]}</p>}
            </div>
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
            {submitting ? "Publishing…" : "Publish listing"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/seller")}
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
                {formatMoney(priceNumber, form.currency)}
              </span>
              <span className="text-sm text-slate">/ night</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
