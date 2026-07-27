"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DailyPnl {
  date: string; // YYYY-MM-DD
  pnl: number;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CalendarHeatmap({ data }: { data: DailyPnl[] }) {
  const pnlByDate = useMemo(() => new Map(data.map((d) => [d.date, d.pnl])), [data]);

  const initial = useMemo(() => {
    const latest = data.length > 0 ? data[data.length - 1].date : new Date().toISOString().slice(0, 10);
    const [y, m] = latest.split("-").map(Number);
    return { year: y, month: m - 1 };
  }, [data]);

  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const maxAbs = useMemo(
    () => data.reduce((max, d) => Math.max(max, Math.abs(d.pnl)), 0) || 1,
    [data]
  );

  const cells = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(year, month, 1));
    const startWeekday = firstOfMonth.getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const items: { day: number | null; date: string | null; pnl: number | null }[] = [];
    for (let i = 0; i < startWeekday; i++) items.push({ day: null, date: null, pnl: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      items.push({ day: d, date, pnl: pnlByDate.get(date) ?? null });
    }
    return items;
  }, [year, month, pnlByDate]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  function cellStyle(pnl: number | null): React.CSSProperties {
    if (pnl === null) return {};
    const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
    const color = pnl >= 0 ? "var(--color-accent)" : "var(--color-error)";
    return {
      backgroundColor: color,
      opacity: 0.15 + intensity * 0.65,
    };
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{monthLabel(year, month)}</span>
        <div className="flex gap-2 -mr-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-accent-tint hover:text-ink cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-accent-tint hover:text-ink cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-center text-[10px] text-muted">
            {w}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell.day === null ? (
            <div key={i} />
          ) : (
            <div
              key={i}
              title={cell.pnl !== null ? `${cell.date}: ${cell.pnl >= 0 ? "+" : ""}$${cell.pnl}` : cell.date ?? undefined}
              style={cellStyle(cell.pnl)}
              className="flex aspect-square items-center justify-center rounded-md border border-hairline text-[11px] tabular-nums text-ink"
            >
              {cell.day}
            </div>
          )
        )}
      </div>
    </div>
  );
}
