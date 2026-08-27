"use client";

import { useState } from "react";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayISO() {
  return toISODate(new Date());
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABEL_FMT = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

function monthWeeks(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function CalendarRangePicker({
  from,
  to,
  onChange,
  minDate = todayISO(),
  maxDate,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  minDate?: string;
  /** Selection and month navigation are both bounded by this so a stray
   * click can't create a huge (and expensive to apply) date range. */
  maxDate?: string;
}) {
  const today = todayISO();
  const [anchor, setAnchor] = useState(() => {
    const base = new Date(`${from || today}T00:00:00`);
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  function isOutOfRange(date: string) {
    return date < minDate || (!!maxDate && date > maxDate);
  }

  function handleDayClick(date: string) {
    if (isOutOfRange(date)) return;
    if (!from || (from && to)) {
      onChange(date, "");
    } else if (date < from) {
      onChange(date, "");
    } else {
      onChange(from, date);
    }
  }

  function shiftMonth(delta: number) {
    setAnchor((a) => {
      const d = new Date(a.year, a.month + delta, 1);
      if (maxDate && delta > 0 && toISODate(d) > maxDate) return a;
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function dayState(date: string | null) {
    if (!date) return "empty";
    if (isOutOfRange(date)) return "disabled";
    if (date === from || date === to) return "endpoint";
    if (from && to && date > from && date < to) return "in-range";
    if (from && !to && hoverDate && hoverDate >= from && date > from && date <= hoverDate) {
      return "preview";
    }
    return "default";
  }

  function renderMonth(year: number, month: number) {
    const weeks = monthWeeks(year, month);
    return (
      <div className="flex-1" key={`${year}-${month}`}>
        <p className="text-center text-sm font-semibold text-ink">
          {MONTH_LABEL_FMT.format(new Date(year, month, 1))}
        </p>
        <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-slate">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-y-1">
          {weeks.flat().map((date, i) => {
            const state = dayState(date);
            if (!date) return <span key={i} />;
            const dayNum = Number(date.slice(8, 10));
            const isToday = date === today;
            return (
              <button
                key={date}
                type="button"
                disabled={state === "disabled"}
                onMouseEnter={() => setHoverDate(date)}
                onClick={() => handleDayClick(date)}
                className={`mx-auto flex h-8 w-8 items-center justify-center text-xs transition ${
                  state === "disabled"
                    ? "cursor-not-allowed text-slate/30"
                    : state === "endpoint"
                    ? "rounded-full bg-accent font-semibold text-white"
                    : state === "in-range" || state === "preview"
                    ? "bg-accent/15 text-accent-deep"
                    : "text-ink hover:bg-paper"
                } ${isToday && state === "default" ? "ring-1 ring-inset ring-accent/40" : ""}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const nextAnchor = new Date(anchor.year, anchor.month + 1, 1);
  const atMax = !!maxDate && toISODate(nextAnchor) > maxDate;

  return (
    <div onMouseLeave={() => setHoverDate(null)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-lg border border-line px-2 py-1 text-xs font-medium text-ink transition hover:border-ink/40"
        >
          ‹
        </button>
        <p className="text-xs text-slate">
          {from ? new Date(`${from}T00:00:00`).toLocaleDateString() : "Start date"}
          {" – "}
          {to ? new Date(`${to}T00:00:00`).toLocaleDateString() : "End date"}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={atMax}
          className="rounded-lg border border-line px-2 py-1 text-xs font-medium text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-6 sm:flex-row">
        {renderMonth(anchor.year, anchor.month)}
        {renderMonth(nextAnchor.getFullYear(), nextAnchor.getMonth())}
      </div>
      {from && !to && <p className="mt-2 text-center text-xs text-slate">Pick an end date</p>}
    </div>
  );
}
