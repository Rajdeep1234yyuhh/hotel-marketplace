"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/validations";

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80";

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
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    update("imageUrl", "");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      update("imageUrl", blob.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    setSubmitting(true);
    setErrors({});
    const res = await fetch("/api/hotels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
            <h3 className="mt-1 font-display text-lg text-ink">
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
