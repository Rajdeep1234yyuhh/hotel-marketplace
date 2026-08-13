"use client";

export type ItineraryDayDraft = {
  title: string;
  description: string;
};

export const emptyItineraryDay: ItineraryDayDraft = { title: "", description: "" };

type Props = {
  dayNumber: number;
  draft: ItineraryDayDraft;
  onChange: (patch: Partial<ItineraryDayDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function ItineraryDayFields({ dayNumber, draft, onChange, onRemove, canRemove }: Props) {
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-deep">
              {dayNumber}
            </span>
            <input
              className="field-input"
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={`Day ${dayNumber} — Arrival & local sightseeing`}
            />
          </div>
          <textarea
            rows={2}
            className="field-input resize-none"
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What happens this day"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-1 shrink-0 text-xs font-medium text-slate hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
