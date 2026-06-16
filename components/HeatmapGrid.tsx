"use client";

import { useState } from "react";

interface HeatmapGridProps {
  startDate: string;
  numDays: number;
  startHour: number;
  endHour: number;
  use24Hour: boolean;
  slotCounts: Map<string, { count: number; names: string[] }>;
  maxCount: number;
}

function formatHour(hour: number, use24Hour: boolean): string {
  if (use24Hour) return `${String(hour).padStart(2, "0")}:00`;
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatDayHeader(startDate: string, dayIndex: number): string {
  const d = new Date(startDate + "T12:00:00");
  d.setDate(d.getDate() + dayIndex);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${weekday}\n${month} ${day}`;
}

function getSlotKey(dayIndex: number, hour: number): string {
  return `${dayIndex}-${hour}`;
}

function getCellColor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return "bg-[#E5E7EB]";
  const ratio = count / maxCount;
  if (ratio <= 0.25) return "bg-[#1F3057]/20";
  if (ratio <= 0.5) return "bg-[#1F3057]/40";
  if (ratio <= 0.75) return "bg-[#1F3057]/70";
  return "bg-[#1F3057]";
}

function getTextColor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return "text-[#9CA3AF]";
  const ratio = count / maxCount;
  return ratio > 0.5 ? "text-white" : "text-[#1F3057]";
}

export default function HeatmapGrid({
  startDate,
  numDays,
  startHour,
  endHour,
  use24Hour,
  slotCounts,
  maxCount,
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
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-16" />
            {days.map((d) => (
              <th
                key={d}
                className="px-1 py-2 text-xs font-medium text-[#6B7280] whitespace-pre-line text-center min-w-[60px]"
              >
                {formatDayHeader(startDate, d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="pr-2 py-0 text-xs text-[#6B7280] text-right whitespace-nowrap">
                {formatHour(hour, use24Hour)}
              </td>
              {days.map((d) => {
                const key = getSlotKey(d, hour);
                const data = slotCounts.get(key);
                const count = data?.count || 0;
                return (
                  <td
                    key={key}
                    className={`border border-white/50 w-[60px] h-[28px] text-center text-xs font-medium cursor-default transition-colors ${getCellColor(count, maxCount)} ${getTextColor(count, maxCount)}`}
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
