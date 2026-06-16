"use client";

import { useState, useMemo } from "react";
import { getAllTimezones } from "@/lib/timezones";

interface TimezoneSelectorProps {
  value: string;
  onChange: (tz: string) => void;
}

export default function TimezoneSelector({
  value,
  onChange,
}: TimezoneSelectorProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const allTz = useMemo(() => getAllTimezones(), []);
  const filtered = useMemo(() => {
    if (!search) return allTz;
    const q = search.toLowerCase();
    return allTz.filter((tz) => tz.toLowerCase().includes(q));
  }, [allTz, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#1F3057] bg-white"
      >
        {value.replace(/_/g, " ")}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search timezones…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1F3057]"
              autoFocus
            />
          </div>
          {filtered.map((tz) => (
            <button
              key={tz}
              type="button"
              className={`block w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 ${
                tz === value ? "bg-gray-100 font-medium" : ""
              }`}
              onClick={() => {
                onChange(tz);
                setOpen(false);
                setSearch("");
              }}
            >
              {tz.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
