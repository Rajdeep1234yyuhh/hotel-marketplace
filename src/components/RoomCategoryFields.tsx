"use client";

import { useRef, useState } from "react";
import { prepareImageForUpload } from "@/lib/image-compression";
import { toList, MEAL_PLAN_OPTIONS } from "@/lib/validations";

// Keep in sync with MAX_BYTES in src/app/api/upload/route.ts.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type RoomCategoryDraft = {
  name: string;
  totalRooms: string;
  pricePerNight: string;
  description: string;
  amenities: string;
  mealPlans: string;
  photos: string[];
};

export const emptyRoomCategory: RoomCategoryDraft = {
  name: "",
  totalRooms: "",
  pricePerNight: "",
  description: "",
  amenities: "",
  mealPlans: "",
  photos: [],
};

type Props = {
  draft: RoomCategoryDraft;
  onChange: (patch: Partial<RoomCategoryDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
  fileInputId: string;
};

export function RoomCategoryFields({ draft, onChange, onRemove, canRemove, fileInputId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadError("");
    setUploading(true);
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
      onChange({ photos: [...draft.photos, ...uploaded] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addPhotoUrl() {
    const url = photoUrlInput.trim();
    if (!url) return;
    onChange({ photos: [...draft.photos, url] });
    setPhotoUrlInput("");
  }

  function removePhoto(i: number) {
    onChange({ photos: draft.photos.filter((_, pi) => pi !== i) });
  }

  const selectedMealPlans = toList(draft.mealPlans);

  function toggleMealPlan(plan: string) {
    const next = selectedMealPlans.includes(plan)
      ? selectedMealPlans.filter((p) => p !== plan)
      : [...selectedMealPlans, plan];
    onChange({ mealPlans: next.join(",") });
  }

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">Category name</label>
            <input
              className="field-input"
              value={draft.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Deluxe Room"
            />
          </div>
          <div>
            <label className="field-label">Rooms in this category</label>
            <input
              type="number"
              min={1}
              className="field-input"
              value={draft.totalRooms}
              onChange={(e) => onChange({ totalRooms: e.target.value })}
              placeholder="5"
            />
          </div>
          <div>
            <label className="field-label">Price / night</label>
            <input
              type="number"
              min={1}
              className="field-input"
              value={draft.pricePerNight}
              onChange={(e) => onChange({ pricePerNight: e.target.value })}
              placeholder="6200"
            />
          </div>
          <div className="col-span-2">
            <label className="field-label">Description</label>
            <input
              className="field-input"
              value={draft.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="What makes this room category different"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">
              Amenities <span className="text-slate">(comma separated)</span>
            </label>
            <input
              className="field-input"
              value={draft.amenities}
              onChange={(e) => onChange({ amenities: e.target.value })}
              placeholder="River view, Free Wi-Fi, Balcony"
            />
          </div>
          <div className="col-span-2">
            <label className="field-label">Meal plans</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_PLAN_OPTIONS.map((plan) => {
                const active = selectedMealPlans.includes(plan);
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => toggleMealPlan(plan)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-accent bg-accent/10 text-accent-deep"
                        : "border-line text-slate hover:border-ink/30 hover:text-ink"
                    }`}
                  >
                    {plan}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="field-label mb-0">Photos</span>
              {draft.photos.length > 0 && (
                <span className="text-xs text-slate">{draft.photos.length} added</span>
              )}
            </div>

            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFilesChange}
            />
            <label
              htmlFor={fileInputId}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
                uploading
                  ? "border-line bg-line/40 cursor-wait"
                  : "border-line hover:border-ink/30 hover:bg-line/30"
              }`}
            >
              {uploading ? (
                <span className="text-sm text-slate">Uploading…</span>
              ) : (
                <span className="text-sm text-slate">
                  Click to upload <span className="font-medium text-ink">or drag and drop</span>
                </span>
              )}
            </label>
            {uploadError && <p className="field-error mt-1">{uploadError}</p>}

            <div className="mt-2 flex gap-2">
              <input
                className="field-input"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPhotoUrl();
                  }
                }}
                placeholder="Or paste an image URL"
              />
              <button
                type="button"
                onClick={addPhotoUrl}
                className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-ink/40"
              >
                Add
              </button>
            </div>

            {draft.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {draft.photos.map((url, i) => (
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
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-6 shrink-0 text-xs font-medium text-slate hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
