"use client";

interface TimeFormatToggleProps {
  use24Hour: boolean;
  onChange: (use24Hour: boolean) => void;
}

export default function TimeFormatToggle({
  use24Hour,
  onChange,
}: TimeFormatToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-gray-300 text-xs overflow-hidden">
      <button
        type="button"
        className={`px-2 py-1 transition-colors ${
          !use24Hour
            ? "bg-[#1F3057] text-white"
            : "bg-white text-[#6B7280] hover:bg-gray-50"
        }`}
        onClick={() => onChange(false)}
      >
        12h
      </button>
      <button
        type="button"
        className={`px-2 py-1 transition-colors ${
          use24Hour
            ? "bg-[#1F3057] text-white"
            : "bg-white text-[#6B7280] hover:bg-gray-50"
        }`}
        onClick={() => onChange(true)}
      >
        24h
      </button>
    </div>
  );
}
