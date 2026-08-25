"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExportCsvButton } from "@/components/ExportCsvButton";

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

type Granularity = "day" | "week" | "month";
type Period = { key: string; label: string; sublabel: string; dates: string[] };

const DAY_COLUMNS = 8;
const WEEK_COLUMNS = 8;
const MONTH_COLUMNS = 6;

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
function addMonths(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + n);
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

function periodsFor(granularity: Granularity, windowStart: string): Period[] {
  if (granularity === "day") {
    return Array.from({ length: DAY_COLUMNS }, (_, i) => {
      const date = addDays(windowStart, i);
      const h = formatHeader(date);
      return { key: date, label: h.weekday, sublabel: h.day, dates: [date] };
    });
  }
  if (granularity === "week") {
    return Array.from({ length: WEEK_COLUMNS }, (_, i) => {
      const start = addDays(windowStart, i * 7);
      const dates = Array.from({ length: 7 }, (_, d) => addDays(start, d));
      return {
        key: start,
        label: `${formatHeader(dates[0]).day} – ${formatHeader(dates[6]).day}`,
        sublabel: "7 days",
        dates,
      };
    });
  }
  const anchor = new Date(`${windowStart}T00:00:00`);
  anchor.setDate(1);
  return Array.from({ length: MONTH_COLUMNS }, (_, i) => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() + i);
    const start = toISODate(d);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, dd) => addDays(start, dd));
    return {
      key: start,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      sublabel: `${daysInMonth} days`,
      dates,
    };
  });
}

function stepWindow(windowStart: string, granularity: Granularity, direction: 1 | -1): string {
  if (granularity === "day") return addDays(windowStart, direction * DAY_COLUMNS);
  if (granularity === "week") return addDays(windowStart, direction * WEEK_COLUMNS * 7);
  return addMonths(windowStart, direction * MONTH_COLUMNS);
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
  const [granularity, setGranularity] = useState<Granularity>("day");
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

  // Applies a patch to every date within a period (a single date, for "By Date").
  function setPeriodCell(roomCategoryId: string, period: Period, patch: Partial<CellValue>) {
    setCells((prev) => {
      const next = { ...prev };
      period.dates.forEach((date) => {
        const key = cellKey(roomCategoryId, date);
        const current = prev[key] ?? mergedCell(roomCategoryId, date);
        next[key] = { ...current, ...patch };
      });
      return next;
    });
  }

  const periods = useMemo(() => periodsFor(granularity, windowStart), [granularity, windowStart]);
  const visibleDates = useMemo(() => periods.flatMap((p) => p.dates), [periods]);

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
    const prevStart = stepWindow(windowStart, granularity, -1);
    const prevPeriods = periodsFor(granularity, prevStart);
    setCells((prev) => {
      const next = { ...prev };
      roomCategories.forEach((rc) => {
        periods.forEach((period, i) => {
          const prevPeriod = prevPeriods[i];
          const sourceKey = cellKey(rc.id, prevPeriod.dates[0]);
          const source = prev[sourceKey] ?? mergedCell(rc.id, prevPeriod.dates[0]);
          period.dates.forEach((date) => {
            const key = cellKey(rc.id, date);
            const current = prev[key] ?? mergedCell(rc.id, date);
            next[key] = { ...current, rate: source.rate, availableRooms: source.availableRooms };
          });
        });
      });
      return next;
    });
    setMessage("Copied the previous period's rates into this view. Click Save All Changes to keep them.");
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
          Closed: c.closed ? "yes" : "no",
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
        next[key] = { ...(prev[key] ?? mergedCell(roomCategoryId, date)), rate, availableRooms };
        applied++;
      });
      return next;
    });
    setMessage(`Imported ${applied} row(s). Review and click Save All Changes.`);
    if (importInputRef.current) importInputRef.current.value = "";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setWindowStart((w) => stepWindow(w, granularity, -1))}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40"
          >
            ‹ Previous
          </button>
          <p className="text-sm font-medium text-ink">
            {formatHeader(periods[0].dates[0]).day} –{" "}
            {formatHeader(periods[periods.length - 1].dates[periods[periods.length - 1].dates.length - 1]).day}
          </p>
          <button
            type="button"
            onClick={() => setWindowStart((w) => stepWindow(w, granularity, 1))}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40"
          >
            Next ›
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

      <div className="mt-4 flex gap-1 rounded-lg border border-line bg-paper/60 p-1 text-sm">
        {(
          [
            ["day", "By Date"],
            ["week", "By Week"],
            ["month", "By Month"],
          ] as [Granularity, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setGranularity(value);
              setWindowStart(todayISO());
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              granularity === value ? "bg-white text-ink shadow-soft" : "text-slate hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <p className="mt-2 text-xs text-slate">{message}</p>}

      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Room Type</th>
              {periods.map((period) => (
                <th key={period.key} className="px-2 py-3 text-center font-medium">
                  <p>{period.label}</p>
                  <p className="text-ink">{period.sublabel}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {roomCategories.map((rc) => (
              <tr key={rc.id}>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <p className="font-medium text-ink">{rc.name}</p>
                  <p className="text-xs text-slate">Max {rc.totalRooms} rooms</p>
                </td>
                {periods.map((period) => {
                  const c = getCell(rc.id, period.dates[0]);
                  return (
                    <td key={period.key} className="px-1.5 py-3 text-center align-top">
                      <input
                        type="number"
                        min={1}
                        value={c.rate}
                        onChange={(e) =>
                          setPeriodCell(rc.id, period, { rate: Number(e.target.value) })
                        }
                        className="w-20 rounded-md border border-line px-1.5 py-1 text-center text-xs"
                      />
                      <input
                        type="number"
                        min={0}
                        value={c.availableRooms}
                        disabled={c.closed}
                        onChange={(e) =>
                          setPeriodCell(rc.id, period, { availableRooms: Number(e.target.value) })
                        }
                        className={`mt-1 w-20 rounded-md border px-1.5 py-1 text-center text-xs ${
                          c.closed
                            ? "border-line bg-line/40 text-slate"
                            : c.availableRooms <= 2
                            ? "border-red-200 text-red-600"
                            : "border-line text-emerald-700"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setPeriodCell(rc.id, period, { closed: !c.closed })}
                        className={`mt-1 block w-full rounded-md px-1 py-0.5 text-[10px] font-medium transition ${
                          c.closed
                            ? "bg-red-50 text-red-600"
                            : "text-slate hover:bg-paper hover:text-ink"
                        }`}
                      >
                        {c.closed ? "Closed" : "Close"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate">
        Editing a week or month sets the same rate and availability across every day in it.
        Inventory in red has 2 or fewer rooms left. Nothing is saved until you click Save All
        Changes.
      </p>
    </div>
  );
}
