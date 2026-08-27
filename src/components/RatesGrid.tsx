"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { CalendarRangePicker } from "@/components/CalendarRangePicker";

type RoomCategoryLite = { id: string; name: string; pricePerNight: number; totalRooms: number };

type OverrideLite = {
  roomCategoryId: string;
  date: string;
  rate: number | null;
  availableRooms: number | null;
  closed: boolean;
  minStay: number | null;
  maxStay: number | null;
};

type CellValue = {
  rate: number;
  availableRooms: number;
  closed: boolean;
  minStay: number | null;
  maxStay: number | null;
};

type EntryPayload = {
  roomCategoryId: string;
  date: string;
  rate: number;
  availableRooms: number;
  closed: boolean;
  minStay: number | null;
  maxStay: number | null;
};

const DAY_COLUMNS = 8;
// Bounds for the "By Calendar" range picker/apply — keeps a stray far-future
// click from building a huge date list (slow to compute) or a payload the
// API would reject anyway (upsertRateOverridesSchema caps at 500 entries).
const CALENDAR_MAX_DAYS_OUT = 365;
const MAX_CALENDAR_ENTRIES = 500;

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
function todayISO() {
  return toISODate(new Date());
}
function formatHeader(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
    day: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  };
}
function cellKey(roomCategoryId: string, date: string) {
  return `${roomCategoryId}|${date}`;
}
function datesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let d = from;
  let guard = 0;
  while (d <= to && guard <= CALENDAR_MAX_DAYS_OUT) {
    dates.push(d);
    d = addDays(d, 1);
    guard++;
  }
  return dates;
}

export function RatesGrid({
  hotelId,
  roomCategories,
  initialOverrides,
}: {
  hotelId: string;
  roomCategories: RoomCategoryLite[];
  initialOverrides: OverrideLite[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"day" | "calendar">("day");
  const [windowStart, setWindowStart] = useState(todayISO());
  const [cells, setCells] = useState<Record<string, CellValue>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  const roomCategoryById = useMemo(
    () => new Map(roomCategories.map((rc) => [rc.id, rc])),
    [roomCategories]
  );

  const overrideMap = useMemo(() => {
    const m = new Map<string, OverrideLite>();
    initialOverrides.forEach((o) => m.set(cellKey(o.roomCategoryId, o.date), o));
    return m;
  }, [initialOverrides]);

  function baseCell(roomCategoryId: string): CellValue {
    const rc = roomCategoryById.get(roomCategoryId);
    return {
      rate: rc?.pricePerNight ?? 0,
      availableRooms: rc?.totalRooms ?? 0,
      closed: false,
      minStay: null,
      maxStay: null,
    };
  }

  function mergedCell(roomCategoryId: string, date: string): CellValue {
    const override = overrideMap.get(cellKey(roomCategoryId, date));
    const base = baseCell(roomCategoryId);
    if (!override) return base;
    return {
      rate: override.rate ?? base.rate,
      availableRooms: override.availableRooms ?? base.availableRooms,
      closed: override.closed,
      minStay: override.minStay,
      maxStay: override.maxStay,
    };
  }

  function getCell(roomCategoryId: string, date: string): CellValue {
    return cells[cellKey(roomCategoryId, date)] ?? mergedCell(roomCategoryId, date);
  }

  function setCell(roomCategoryId: string, date: string, patch: Partial<CellValue>) {
    setCells((prev) => {
      const key = cellKey(roomCategoryId, date);
      const current = prev[key] ?? mergedCell(roomCategoryId, date);
      return { ...prev, [key]: { ...current, ...patch } };
    });
  }

  const visibleDates = useMemo(
    () => Array.from({ length: DAY_COLUMNS }, (_, i) => addDays(windowStart, i)),
    [windowStart]
  );

  async function postEntries(payload: EntryPayload[]): Promise<boolean> {
    if (payload.length === 0) return true;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/hotels/${hotelId}/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: payload }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Couldn't save changes. Try again.");
      return false;
    }
    setMessage(`Saved ${payload.length} entr${payload.length === 1 ? "y" : "ies"}.`);
    router.refresh();
    return true;
  }

  function saveVisible() {
    const entries = roomCategories.flatMap((rc) =>
      visibleDates.map((date) => ({ roomCategoryId: rc.id, date, ...getCell(rc.id, date) }))
    );
    postEntries(entries);
  }

  function copyPreviousRates() {
    const prevStart = addDays(windowStart, -DAY_COLUMNS);
    setCells((prev) => {
      const next = { ...prev };
      roomCategories.forEach((rc) => {
        visibleDates.forEach((date, i) => {
          const prevDate = addDays(prevStart, i);
          const source = prev[cellKey(rc.id, prevDate)] ?? mergedCell(rc.id, prevDate);
          const key = cellKey(rc.id, date);
          const current = prev[key] ?? mergedCell(rc.id, date);
          next[key] = { ...current, rate: source.rate, availableRooms: source.availableRooms };
        });
      });
      return next;
    });
    setMessage("Copied last week's rates into this view. Click Save All Changes to keep them.");
  }

  function exportRows() {
    return roomCategories.flatMap((rc) =>
      visibleDates.map((date) => {
        const c = getCell(rc.id, date);
        return {
          RoomType: rc.name,
          Date: date,
          Rate: c.rate,
          Inventory: c.availableRooms,
        };
      })
    );
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    const [header, ...rows] = lines;
    const cols = header.split(",").map((c) => c.trim().toLowerCase());
    const roomTypeIdx = cols.indexOf("roomtype");
    const dateIdx = cols.indexOf("date");
    const rateIdx = cols.indexOf("rate");
    const inventoryIdx = cols.indexOf("inventory");
    if (roomTypeIdx === -1 || dateIdx === -1 || rateIdx === -1 || inventoryIdx === -1) {
      setMessage("CSV must have RoomType,Date,Rate,Inventory columns.");
      return;
    }
    const nameToId = new Map(roomCategories.map((rc) => [rc.name.toLowerCase(), rc.id]));
    let applied = 0;
    setCells((prev) => {
      const next = { ...prev };
      rows.forEach((line) => {
        if (!line.trim()) return;
        const parts = line.split(",");
        const roomCategoryId = nameToId.get((parts[roomTypeIdx] ?? "").trim().toLowerCase());
        const date = (parts[dateIdx] ?? "").trim();
        const rate = Number(parts[rateIdx]);
        const availableRooms = Number(parts[inventoryIdx]);
        if (!roomCategoryId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        if (!Number.isFinite(rate) || !Number.isFinite(availableRooms)) return;
        const key = cellKey(roomCategoryId, date);
        next[key] = {
          ...(prev[key] ?? mergedCell(roomCategoryId, date)),
          rate,
          availableRooms,
          closed: false,
        };
        applied++;
      });
      return next;
    });
    setMessage(`Imported ${applied} row(s). Review and click Save All Changes.`);
    if (importInputRef.current) importInputRef.current.value = "";
  }

  // --- Calendar range tab ---
  const [calRoomCategoryIds, setCalRoomCategoryIds] = useState<string[]>(
    roomCategories.map((rc) => rc.id)
  );
  const [calFrom, setCalFrom] = useState(todayISO());
  const [calTo, setCalTo] = useState(todayISO());
  const [calRate, setCalRate] = useState("");
  const [calAvailability, setCalAvailability] = useState("");
  // Set right after a successful apply; cleared as soon as the user starts
  // picking a new range. The picker itself stays open the whole time so the
  // next range can be chosen immediately.
  const [calAppliedSummary, setCalAppliedSummary] = useState("");

  function toggleCalRoomCategory(id: string) {
    setCalRoomCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function applyCalendarRange() {
    if (!calFrom || !calTo || calFrom > calTo) {
      setMessage("Pick a valid date range.");
      return;
    }
    if (calRoomCategoryIds.length === 0) {
      setMessage("Pick at least one room type.");
      return;
    }
    if (!calRate.trim() && !calAvailability.trim()) {
      setMessage("Enter a rate and/or available rooms to apply.");
      return;
    }
    const dates = datesInRange(calFrom, calTo);
    if (dates.length * calRoomCategoryIds.length > MAX_CALENDAR_ENTRIES) {
      setMessage(
        `That's too many date/room-type combinations at once (max ${MAX_CALENDAR_ENTRIES}). Pick a smaller range or fewer room types.`
      );
      return;
    }

    const patch: Partial<CellValue> = { closed: false };
    if (calRate.trim()) patch.rate = Number(calRate);
    if (calAvailability.trim()) patch.availableRooms = Number(calAvailability);

    const payload: EntryPayload[] = [];
    const newValues: Record<string, CellValue> = {};
    const previousValues: Record<string, CellValue> = {};
    calRoomCategoryIds.forEach((roomCategoryId) => {
      dates.forEach((date) => {
        const current = getCell(roomCategoryId, date);
        previousValues[cellKey(roomCategoryId, date)] = current;
        const merged = { ...current, ...patch };
        newValues[cellKey(roomCategoryId, date)] = merged;
        payload.push({ roomCategoryId, date, ...merged });
      });
    });

    // Reflect the change locally right away — Save/Apply shouldn't feel
    // stuck waiting on the network round trip and page refresh.
    setCells((prev) => ({ ...prev, ...newValues }));

    const appliedFrom = calFrom;
    const appliedTo = calTo;

    const ok = await postEntries(payload);
    if (ok) {
      setMessage("");
      setCalAppliedSummary(
        `${new Date(`${appliedFrom}T00:00:00`).toLocaleDateString()} – ${new Date(
          `${appliedTo}T00:00:00`
        ).toLocaleDateString()} · ${dates.length} date(s) × ${calRoomCategoryIds.length} room type(s)`
      );
      // Clear the selection (not the whole form) so the picker is ready for
      // the next range right away.
      setCalFrom("");
      setCalTo("");
    } else {
      // The save didn't actually persist — undo the optimistic update so
      // the grid doesn't show values that were never saved.
      setCells((prev) => ({ ...prev, ...previousValues }));
    }
  }

  if (roomCategories.length === 0) {
    return (
      <div className="rounded-card border border-line bg-white p-6 text-sm text-slate">
        This property doesn&apos;t have any room categories yet — add one from the property
        edit page first.
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 rounded-lg border border-line bg-paper/60 p-1 text-sm">
        <TabButton active={tab === "day"} onClick={() => setTab("day")}>
          By Date
        </TabButton>
        <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")}>
          By Calendar
        </TabButton>
      </div>

      {tab === "day" && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWindowStart((w) => addDays(w, -DAY_COLUMNS))}
                className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40"
              >
                ‹ Previous week
              </button>
              <p className="text-sm font-medium text-ink">
                {formatHeader(visibleDates[0]).day} –{" "}
                {formatHeader(visibleDates[visibleDates.length - 1]).day}
              </p>
              <button
                type="button"
                onClick={() => setWindowStart((w) => addDays(w, DAY_COLUMNS))}
                className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40"
              >
                Next week ›
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ExportCsvButton rows={exportRows()} filename={`rates-${windowStart}.csv`} label="Export" />
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-ink/40">
                Import Rates
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleImportFile}
                />
              </label>
              <button
                type="button"
                onClick={copyPreviousRates}
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-ink/40"
              >
                Copy Previous Rates
              </button>
              <button
                type="button"
                onClick={saveVisible}
                disabled={saving}
                className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-deep disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save All Changes"}
              </button>
            </div>
          </div>

          {message && <p className="mt-2 text-xs text-slate">{message}</p>}

          <div className="mt-4 overflow-x-auto rounded-card border border-line bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Room Type</th>
                  {visibleDates.map((date) => {
                    const h = formatHeader(date);
                    return (
                      <th key={date} className="px-2 py-3 text-center font-medium">
                        <p>{h.weekday}</p>
                        <p className="text-ink">{h.day}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {roomCategories.map((rc) => (
                  <tr key={rc.id}>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <p className="font-medium text-ink">{rc.name}</p>
                      <p className="text-xs text-slate">Max {rc.totalRooms} rooms</p>
                    </td>
                    {visibleDates.map((date) => {
                      const c = getCell(rc.id, date);
                      const soldOut = c.availableRooms <= 0;
                      return (
                        <td key={date} className="px-1.5 py-3 text-center align-top">
                          <input
                            type="number"
                            min={1}
                            value={c.rate}
                            onChange={(e) =>
                              setCell(rc.id, date, { rate: Number(e.target.value) })
                            }
                            className="w-20 rounded-md border border-line px-1.5 py-1 text-center text-xs"
                          />
                          <input
                            type="number"
                            min={0}
                            value={c.availableRooms}
                            onChange={(e) =>
                              setCell(rc.id, date, {
                                availableRooms: Number(e.target.value),
                                closed: false,
                              })
                            }
                            className={`mt-1 w-20 rounded-md border px-1.5 py-1 text-center text-xs ${
                              soldOut
                                ? "border-red-200 text-red-600"
                                : c.availableRooms <= 2
                                ? "border-red-200 text-red-600"
                                : "border-line text-emerald-700"
                            }`}
                          />
                          {soldOut && (
                            <p className="mt-1 text-[10px] font-semibold text-red-600">Sold out</p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate">
            Set available rooms to 0 to mark a date sold out. Guests booking this hotel will
            see the same rates and see &quot;Sold Out&quot; for dates with no availability.
            Nothing is saved until you click Save All Changes.
          </p>
        </>
      )}

      {tab === "calendar" && (
        <div className="mt-4 max-w-2xl space-y-4 rounded-card border border-line bg-white p-5">
          {calAppliedSummary && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                ✓
              </span>
              <span className="font-medium text-emerald-800">Applied</span>
              <span className="text-emerald-700">{calAppliedSummary}</span>
            </div>
          )}
          {message && <p className="text-xs text-slate">{message}</p>}
          <div>
            <p className="field-label">Room types</p>
            <div className="flex flex-wrap gap-2">
              {roomCategories.map((rc) => (
                <label
                  key={rc.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    calRoomCategoryIds.includes(rc.id)
                      ? "border-accent bg-accent/10 text-accent-deep"
                      : "border-line text-slate hover:border-ink/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={calRoomCategoryIds.includes(rc.id)}
                    onChange={() => toggleCalRoomCategory(rc.id)}
                  />
                  {rc.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">Dates</p>
            <div className="rounded-lg border border-line p-3">
              <CalendarRangePicker
                from={calFrom}
                to={calTo}
                maxDate={addDays(todayISO(), CALENDAR_MAX_DAYS_OUT)}
                onChange={(from, to) => {
                  setCalFrom(from);
                  setCalTo(to);
                  setCalAppliedSummary("");
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Rate per night (leave blank to keep)</label>
              <input
                type="number"
                min={1}
                value={calRate}
                onChange={(e) => setCalRate(e.target.value)}
                className="field-input"
                placeholder="e.g. 4500"
              />
            </div>
            <div>
              <label className="field-label">Available rooms (leave blank to keep)</label>
              <input
                type="number"
                min={0}
                value={calAvailability}
                onChange={(e) => setCalAvailability(e.target.value)}
                className="field-input"
                placeholder="0 = sold out"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={applyCalendarRange}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep disabled:opacity-50"
          >
            {saving ? "Applying…" : "Apply to selected dates"}
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? "bg-white text-ink shadow-soft" : "text-slate hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
