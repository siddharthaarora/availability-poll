"use client";

interface ViewToggleProps {
  view: "selection" | "results";
  onChange: (view: "selection" | "results") => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-gray-300 text-xs overflow-hidden">
      <button
        type="button"
        className={`px-2.5 py-1 transition-colors ${
          view === "selection"
            ? "bg-[#1F3057] text-white"
            : "bg-white text-[#6B7280] hover:bg-gray-50"
        }`}
        onClick={() => onChange("selection")}
      >
        Selection
      </button>
      <button
        type="button"
        className={`px-2.5 py-1 transition-colors ${
          view === "results"
            ? "bg-[#1F3057] text-white"
            : "bg-white text-[#6B7280] hover:bg-gray-50"
        }`}
        onClick={() => onChange("results")}
      >
        Results
      </button>
    </div>
  );
}
