"use client";

import { useState } from "react";

interface HeatmapGridProps {
  startDate: string;
  numDays: number;
  startHour: number;
  endHour: number;
  use24Hour: boolean;
  showDates: boolean;
  slotCounts: Map<string, { count: number; names: string[] }>;
  maxCount: number;
  totalRespondents: number;
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

function getSlotKey(dayIndex: number, hour: number): string {
  return `${dayIndex}-${hour}`;
}

// Shade by the fraction of the group that is free, so a slot where everyone
// overlaps is clearly the darkest.
function getCellColor(count: number, total: number): string {
  if (count === 0 || total === 0) return "bg-[#E5E7EB]";
  const ratio = count / total;
  if (ratio >= 1) return "bg-[#1F3057]";
  if (ratio >= 0.66) return "bg-[#1F3057]/75";
  if (ratio >= 0.5) return "bg-[#1F3057]/55";
  if (ratio >= 0.34) return "bg-[#1F3057]/40";
  return "bg-[#1F3057]/25";
}

function getTextColor(count: number, total: number): string {
  if (count === 0 || total === 0) return "text-[#9CA3AF]";
  return count / total >= 0.5 ? "text-white" : "text-[#1F3057]";
}

export default function HeatmapGrid({
  startDate,
  numDays,
  startHour,
  endHour,
  use24Hour,
  showDates,
  slotCounts,
  maxCount,
  totalRespondents,
}: HeatmapGridProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const days = Array.from({ length: numDays }, (_, i) => i);

  const hoveredData = hoveredSlot ? slotCounts.get(hoveredSlot) : null;

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-16" />
            {days.map((d) => (
              <th
                key={d}
                className="px-1 py-2 text-xs font-medium text-[#6B7280] whitespace-pre-line text-center"
              >
                {formatDayHeader(startDate, d, showDates)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="w-16 pr-2 py-0 text-xs text-[#6B7280] text-right whitespace-nowrap">
                {formatHour(hour, use24Hour)}
              </td>
              {days.map((d) => {
                const key = getSlotKey(d, hour);
                const data = slotCounts.get(key);
                const count = data?.count || 0;
                const everyone = count > 0 && count === totalRespondents;
                return (
                  <td
                    key={key}
                    className={`border border-white/50 h-8 text-center text-xs font-semibold cursor-default transition-colors ${getCellColor(count, totalRespondents)} ${getTextColor(count, totalRespondents)} ${
                      everyone && totalRespondents > 1
                        ? "outline outline-2 -outline-offset-2 outline-[#0B1220]"
                        : ""
                    }`}
                    onMouseEnter={(e) => {
                      setHoveredSlot(key);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredSlot(null)}
                  >
                    {count > 0 ? count : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7280]">
        <span>1 free</span>
        <div className="flex gap-0.5">
          <span className="h-3.5 w-6 rounded-sm bg-[#1F3057]/25" />
          <span className="h-3.5 w-6 rounded-sm bg-[#1F3057]/40" />
          <span className="h-3.5 w-6 rounded-sm bg-[#1F3057]/55" />
          <span className="h-3.5 w-6 rounded-sm bg-[#1F3057]/75" />
          <span className="h-3.5 w-6 rounded-sm bg-[#1F3057] outline outline-2 -outline-offset-2 outline-[#0B1220]" />
        </div>
        <span>
          all {totalRespondents} free
        </span>
        <span className="ml-1 text-[#9CA3AF]">
          — numbers show how many people overlap
        </span>
      </div>

      {hoveredSlot && hoveredData && hoveredData.count > 0 && (
        <div
          className="fixed z-50 bg-[#111827] text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full -mt-2"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-medium mb-1">
            {hoveredData.count} available
          </div>
          {hoveredData.names.map((name) => (
            <div key={name} className="text-gray-300">
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
