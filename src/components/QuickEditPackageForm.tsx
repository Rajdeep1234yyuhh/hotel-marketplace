"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { prepareImageForUpload } from "@/lib/image-compression";

// Keep in sync with MAX_BYTES in src/app/api/upload/route.ts.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

type Props = {
  packageId: string;
  initial: {
    title: string;
    destination: string;
    description: string;
    coverImage: string;
  };
};

export function QuickEditPackageForm({ packageId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
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
      update("coverImage", data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    setErrors({});
    setSubmitting(true);
    const res = await fetch(`/api/packages/${packageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(typeof data.error === "object" ? data.error : { _: [String(data.error)] });
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <label htmlFor="title" className="field-label">
          Package title
        </label>
        <input
          id="title"
          className="field-input"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
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
        />
        {errors.destination && <p className="field-error">{errors.destination[0]}</p>}
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
        />
        {errors.description && <p className="field-error">{errors.description[0]}</p>}
      </div>

      <div>
        <span className="field-label mb-2 block">Cover photo</span>
        {form.coverImage ? (
          <div className="group relative aspect-[4/3] max-w-sm overflow-hidden rounded-lg border border-line bg-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.coverImage} alt="Cover" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => update("coverImage", "")}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              id="coverImageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
            />
            <label
              htmlFor="coverImageFile"
              className={`flex max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                uploading
                  ? "border-line bg-line/40 cursor-wait"
                  : "border-line hover:border-ink/30 hover:bg-line/30"
              }`}
            >
              {uploading ? (
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
        {uploadError && <p className="field-error mt-1">{uploadError}</p>}
        {errors.coverImage && <p className="field-error mt-1">{errors.coverImage[0]}</p>}
      </div>

      {errors._ && <p className="field-error">{errors._[0]}</p>}

      <div className="flex gap-3 pt-2">
        <Button onClick={submit} disabled={submitting} variant="secondary">
          {submitting ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/admin")} type="button">
          Cancel
        </Button>
      </div>
    </div>
  );
}
