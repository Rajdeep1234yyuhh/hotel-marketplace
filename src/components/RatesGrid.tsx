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

const WINDOW_SIZE = 8;

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
  const [tab, setTab] = useState<"date" | "roomType" | "bulk">("date");
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

  function getCell(roomCategoryId: string, date: string): CellValue {
    const key = cellKey(roomCategoryId, date);
    if (cells[key]) return cells[key];
    const override = overrideMap.get(key);
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

  function setCell(roomCategoryId: string, date: string, patch: Partial<CellValue>) {
    const key = cellKey(roomCategoryId, date);
    setCells((prev) => ({ ...prev, [key]: { ...getCell(roomCategoryId, date), ...patch } }));
  }

  const visibleDates = useMemo(
    () => Array.from({ length: WINDOW_SIZE }, (_, i) => addDays(windowStart, i)),
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

  function entriesFor(roomCategoryIds: string[], dates: string[]): EntryPayload[] {
    return roomCategoryIds.flatMap((roomCategoryId) =>
      dates.map((date) => {
        const c = getCell(roomCategoryId, date);
        return { roomCategoryId, date, ...c };
      })
    );
  }

  function saveVisible() {
    postEntries(entriesFor(roomCategories.map((rc) => rc.id), visibleDates));
  }

  // --- Quick actions (By Date tab) ---
  const [adjustAmount, setAdjustAmount] = useState("10");
  const [adjustMode, setAdjustMode] = useState<"percent" | "flat">("percent");

  function adjustRates(direction: 1 | -1) {
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setCells((prev) => {
      const next = { ...prev };
      roomCategories.forEach((rc) => {
        visibleDates.forEach((date) => {
          const current = getCell(rc.id, date);
          const delta =
            adjustMode === "percent" ? Math.round(current.rate * (amount / 100)) : amount;
          next[cellKey(rc.id, date)] = { ...current, rate: Math.max(1, current.rate + direction * delta) };
        });
      });
      return next;
    });
  }

  const [minStayInput, setMinStayInput] = useState("");
  const [maxStayInput, setMaxStayInput] = useState("");

  function applyStayRules() {
    const minStay = minStayInput ? Number(minStayInput) : null;
    const maxStay = maxStayInput ? Number(maxStayInput) : null;
    setCells((prev) => {
      const next = { ...prev };
      roomCategories.forEach((rc) => {
        visibleDates.forEach((date) => {
          next[cellKey(rc.id, date)] = { ...getCell(rc.id, date), minStay, maxStay };
        });
      });
      return next;
    });
  }

  function setClosedForView(closed: boolean) {
    setCells((prev) => {
      const next = { ...prev };
      roomCategories.forEach((rc) => {
        visibleDates.forEach((date) => {
          next[cellKey(rc.id, date)] = { ...getCell(rc.id, date), closed };
        });
      });
      return next;
    });
  }

  function copyPreviousRates() {
    const prevStart = addDays(windowStart, -WINDOW_SIZE);
    setCells((prev) => {
      const next = { ...prev };
      roomCategories.forEach((rc) => {
        visibleDates.forEach((date, i) => {
          const source = getCell(rc.id, addDays(prevStart, i));
          next[cellKey(rc.id, date)] = {
            ...getCell(rc.id, date),
            rate: source.rate,
            availableRooms: source.availableRooms,
          };
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
        next[cellKey(roomCategoryId, date)] = { ...getCell(roomCategoryId, date), rate, availableRooms };
        applied++;
      });
      return next;
    });
    setMessage(`Imported ${applied} row(s). Review and click Save All Changes.`);
    if (importInputRef.current) importInputRef.current.value = "";
  }

  // --- By Room Type tab ---
  const [baseEdits, setBaseEdits] = useState<Record<string, { pricePerNight: string; totalRooms: string }>>(
    {}
  );
  const [baseSaving, setBaseSaving] = useState<string | null>(null);

  function baseEditFor(rc: RoomCategoryLite) {
    return (
      baseEdits[rc.id] ?? { pricePerNight: String(rc.pricePerNight), totalRooms: String(rc.totalRooms) }
    );
  }

  async function saveBaseEdit(rc: RoomCategoryLite) {
    const edit = baseEditFor(rc);
    setBaseSaving(rc.id);
    const res = await fetch(`/api/room-categories/${rc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pricePerNight: Number(edit.pricePerNight),
        totalRooms: Number(edit.totalRooms),
      }),
    });
    setBaseSaving(null);
    if (res.ok) {
      setMessage(`Updated base rate for ${rc.name}.`);
      router.refresh();
    } else {
      setMessage(`Couldn't update ${rc.name}.`);
    }
  }

  // --- Bulk Update tab ---
  const [bulkRoomCategoryIds, setBulkRoomCategoryIds] = useState<string[]>(
    roomCategories.map((rc) => rc.id)
  );
  const [bulkStart, setBulkStart] = useState(visibleDates[0]);
  const [bulkEnd, setBulkEnd] = useState(visibleDates[visibleDates.length - 1]);
  const [bulkRate, setBulkRate] = useState("");
  const [bulkInventory, setBulkInventory] = useState("");
  const [bulkMinStay, setBulkMinStay] = useState("");
  const [bulkMaxStay, setBulkMaxStay] = useState("");
  const [bulkClosed, setBulkClosed] = useState<"" | "open" | "closed">("");

  function toggleBulkRoomCategory(id: string) {
    setBulkRoomCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function applyBulkUpdate() {
    const dates = visibleDates.filter((d) => d >= bulkStart && d <= bulkEnd);
    if (dates.length === 0 || bulkRoomCategoryIds.length === 0) {
      setMessage("Pick at least one room type and a date range within the loaded week.");
      return;
    }
    const patch: Partial<CellValue> = {};
    if (bulkRate.trim()) patch.rate = Number(bulkRate);
    if (bulkInventory.trim()) patch.availableRooms = Number(bulkInventory);
    if (bulkMinStay.trim()) patch.minStay = Number(bulkMinStay);
    if (bulkMaxStay.trim()) patch.maxStay = Number(bulkMaxStay);
    if (bulkClosed) patch.closed = bulkClosed === "closed";

    const newValues: Record<string, CellValue> = {};
    bulkRoomCategoryIds.forEach((roomCategoryId) => {
      dates.forEach((date) => {
        newValues[cellKey(roomCategoryId, date)] = { ...getCell(roomCategoryId, date), ...patch };
      });
    });
    setCells((prev) => ({ ...prev, ...newValues }));

    const payload: EntryPayload[] = Object.entries(newValues).map(([key, v]) => {
      const [roomCategoryId, date] = key.split("|");
      return { roomCategoryId, date, ...v };
    });
    await postEntries(payload);
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
        <TabButton active={tab === "date"} onClick={() => setTab("date")}>
          By Date
        </TabButton>
        <TabButton active={tab === "roomType"} onClick={() => setTab("roomType")}>
          By Room Type
        </TabButton>
        <TabButton active={tab === "bulk"} onClick={() => setTab("bulk")}>
          Bulk Update
        </TabButton>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setWindowStart((w) => addDays(w, -WINDOW_SIZE))}
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
            onClick={() => setWindowStart((w) => addDays(w, WINDOW_SIZE))}
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

      {tab === "date" && (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="overflow-x-auto rounded-card border border-line bg-white">
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
                            disabled={c.closed}
                            onChange={(e) =>
                              setCell(rc.id, date, { availableRooms: Number(e.target.value) })
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
                            onClick={() => setCell(rc.id, date, { closed: !c.closed })}
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

          <div className="space-y-4">
            <div className="rounded-card border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">Quick actions</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="field-input h-9 w-16 text-sm"
                />
                <select
                  value={adjustMode}
                  onChange={(e) => setAdjustMode(e.target.value as "percent" | "flat")}
                  className="field-input h-9 w-auto text-sm"
                >
                  <option value="percent">%</option>
                  <option value="flat">₹</option>
                </select>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => adjustRates(1)}
                  className="rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  ↑ Increase Rates
                </button>
                <button
                  type="button"
                  onClick={() => adjustRates(-1)}
                  className="rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  ↓ Decrease Rates
                </button>
              </div>

              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs font-semibold text-ink">Min / Max stay</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    placeholder="Min"
                    value={minStayInput}
                    onChange={(e) => setMinStayInput(e.target.value)}
                    className="field-input h-9 w-16 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Max"
                    value={maxStayInput}
                    onChange={(e) => setMaxStayInput(e.target.value)}
                    className="field-input h-9 w-16 text-sm"
                  />
                  <button
                    type="button"
                    onClick={applyStayRules}
                    className="rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => setClosedForView(true)}
                  className="rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Close Rooms
                </button>
                <button
                  type="button"
                  onClick={() => setClosedForView(false)}
                  className="rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40"
                >
                  Reopen Rooms
                </button>
              </div>
            </div>

            <div className="rounded-card border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">Tips</p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate">
                <li>Inventory shown in red has 2 or fewer rooms left that day.</li>
                <li>Closing a date blocks new bookings without changing the rate.</li>
                <li>Use Bulk Update to change several room types or dates at once.</li>
                <li>Nothing is saved until you click Save All Changes.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "roomType" && (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Room Type</th>
                <th className="px-4 py-3 font-medium">Base rate / night</th>
                <th className="px-4 py-3 font-medium">Total rooms</th>
                <th className="px-4 py-3 text-right font-medium">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {roomCategories.map((rc) => {
                const edit = baseEditFor(rc);
                return (
                  <tr key={rc.id}>
                    <td className="px-4 py-3 font-medium text-ink">{rc.name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={edit.pricePerNight}
                        onChange={(e) =>
                          setBaseEdits((prev) => ({
                            ...prev,
                            [rc.id]: { ...edit, pricePerNight: e.target.value },
                          }))
                        }
                        className="field-input h-9 w-28 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={edit.totalRooms}
                        onChange={(e) =>
                          setBaseEdits((prev) => ({
                            ...prev,
                            [rc.id]: { ...edit, totalRooms: e.target.value },
                          }))
                        }
                        className="field-input h-9 w-24 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => saveBaseEdit(rc)}
                        disabled={baseSaving === rc.id}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50"
                      >
                        {baseSaving === rc.id ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "bulk" && (
        <div className="mt-4 max-w-2xl space-y-4 rounded-card border border-line bg-white p-5">
          <div>
            <p className="field-label">Room types</p>
            <div className="flex flex-wrap gap-2">
              {roomCategories.map((rc) => (
                <label
                  key={rc.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    bulkRoomCategoryIds.includes(rc.id)
                      ? "border-accent bg-accent/10 text-accent-deep"
                      : "border-line text-slate hover:border-ink/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={bulkRoomCategoryIds.includes(rc.id)}
                    onChange={() => toggleBulkRoomCategory(rc.id)}
                  />
                  {rc.name}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">From (within loaded week)</label>
              <input
                type="date"
                min={visibleDates[0]}
                max={visibleDates[visibleDates.length - 1]}
                value={bulkStart}
                onChange={(e) => setBulkStart(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">To (within loaded week)</label>
              <input
                type="date"
                min={visibleDates[0]}
                max={visibleDates[visibleDates.length - 1]}
                value={bulkEnd}
                onChange={(e) => setBulkEnd(e.target.value)}
                className="field-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Rate (leave blank to keep)</label>
              <input
                type="number"
                min={1}
                value={bulkRate}
                onChange={(e) => setBulkRate(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Available rooms (leave blank to keep)</label>
              <input
                type="number"
                min={0}
                value={bulkInventory}
                onChange={(e) => setBulkInventory(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Min stay (leave blank to keep)</label>
              <input
                type="number"
                min={1}
                value={bulkMinStay}
                onChange={(e) => setBulkMinStay(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Max stay (leave blank to keep)</label>
              <input
                type="number"
                min={1}
                value={bulkMaxStay}
                onChange={(e) => setBulkMaxStay(e.target.value)}
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label">Availability</label>
            <select
              value={bulkClosed}
              onChange={(e) => setBulkClosed(e.target.value as "" | "open" | "closed")}
              className="field-input"
            >
              <option value="">Leave as is</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button
            type="button"
            onClick={applyBulkUpdate}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep disabled:opacity-50"
          >
            {saving ? "Applying…" : "Apply & Save"}
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
