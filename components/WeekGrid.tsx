"use client";

import { useCallback, useRef, useState } from "react";

interface WeekGridProps {
  startDate: string;
  numDays: number;
  startHour: number;
  endHour: number;
  timezone: string;
  use24Hour: boolean;
  showDates: boolean;
  selected: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

function getSlotKey(dayIndex: number, hour: number): string {
  return `${dayIndex}-${hour}`;
}

// Offset (ms) of `timezone` from UTC at the given instant: wallClock - utc.
function tzOffsetMs(timezone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0;
  const asUTC = Date.UTC(
    parseInt(map.year, 10),
    parseInt(map.month, 10) - 1,
    parseInt(map.day, 10),
    hour,
    parseInt(map.minute, 10),
    parseInt(map.second, 10)
  );
  return asUTC - date.getTime();
}

function slotToUtc(
  startDate: string,
  dayIndex: number,
  hour: number,
  timezone: string
): string {
  // Calendar date for startDate + dayIndex (done in UTC to avoid DST drift).
  const base = new Date(startDate + "T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + dayIndex);

  // The target wall-clock (hour:00 on that day) treated as if it were UTC.
  const guess = Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    hour,
    0,
    0
  );

  // Real UTC instant = wall-clock minus the zone's offset at that moment.
  // Refine once so slots on a DST boundary resolve correctly.
  const offset1 = tzOffsetMs(timezone, new Date(guess));
  const offset2 = tzOffsetMs(timezone, new Date(guess - offset1));
  return new Date(guess - offset2).toISOString();
}

export function slotKeyToUtc(
  key: string,
  startDate: string,
  timezone: string
): string {
  const [dayStr, hourStr] = key.split("-");
  return slotToUtc(startDate, parseInt(dayStr), parseInt(hourStr), timezone);
}

function formatHour(hour: number, use24Hour: boolean): string {
  if (use24Hour) return `${String(hour).padStart(2, "0")}:00`;
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatDayHeader(
  startDate: string,
  dayIndex: number,
  showDates: boolean
): string {
  const d = new Date(startDate + "T12:00:00");
  d.setDate(d.getDate() + dayIndex);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  if (!showDates) return weekday;
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${weekday}\n${month} ${day}`;
}

export default function WeekGrid({
  startDate,
  numDays,
  startHour,
  endHour,
  timezone: _timezone,
  use24Hour,
  showDates,
  selected,
  onSelectionChange,
}: WeekGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragIntentRef = useRef<"select" | "deselect">("select");
  const dragCellsRef = useRef<Set<string>>(new Set());

  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const days = Array.from({ length: numDays }, (_, i) => i);

  const toggleCell = useCallback(
    (key: string) => {
      const next = new Set(selected);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onSelectionChange(next);
    },
    [selected, onSelectionChange]
  );

  const applyDrag = useCallback(
    (key: string) => {
      if (dragCellsRef.current.has(key)) return;
      dragCellsRef.current.add(key);
      const next = new Set(selected);
      if (dragIntentRef.current === "select") next.add(key);
      else next.delete(key);
      onSelectionChange(next);
    },
    [selected, onSelectionChange]
  );

  const handlePointerDown = useCallback(
    (key: string) => {
      setIsDragging(true);
      dragCellsRef.current = new Set([key]);
      dragIntentRef.current = selected.has(key) ? "deselect" : "select";
      toggleCell(key);
    },
    [selected, toggleCell]
  );

  const handlePointerEnter = useCallback(
    (key: string) => {
      if (!isDragging) return;
      applyDrag(key);
    },
    [isDragging, applyDrag]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragCellsRef.current = new Set();
  }, []);

  const toggleColumn = (dayIndex: number) => {
    const keys = hours.map((h) => getSlotKey(dayIndex, h));
    const allSelected = keys.every((k) => selected.has(k));
    const next = new Set(selected);
    keys.forEach((k) => {
      if (allSelected) next.delete(k);
      else next.add(k);
    });
    onSelectionChange(next);
  };

  const toggleRow = (hour: number) => {
    const keys = days.map((d) => getSlotKey(d, hour));
    const allSelected = keys.every((k) => selected.has(k));
    const next = new Set(selected);
    keys.forEach((k) => {
      if (allSelected) next.delete(k);
      else next.add(k);
    });
    onSelectionChange(next);
  };

  return (
    <div
      className="select-none overflow-x-auto"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-16" />
            {days.map((d) => (
              <th
                key={d}
                className="px-1 py-2 text-xs font-medium text-[#6B7280] cursor-pointer hover:text-[#1F3057] whitespace-pre-line text-center"
                onClick={() => toggleColumn(d)}
              >
                {formatDayHeader(startDate, d, showDates)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td
                className="w-16 pr-2 py-0 text-xs text-[#6B7280] text-right cursor-pointer hover:text-[#1F3057] whitespace-nowrap"
                onClick={() => toggleRow(hour)}
              >
                {formatHour(hour, use24Hour)}
              </td>
              {days.map((d) => {
                const key = getSlotKey(d, hour);
                const isSelected = selected.has(key);
                return (
                  <td
                    key={key}
                    className={`border border-white/50 h-8 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#1F3057]" : "bg-[#E5E7EB] hover:bg-[#D1D5DB]"
                    }`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handlePointerDown(key);
                    }}
                    onPointerEnter={() => handlePointerEnter(key)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
