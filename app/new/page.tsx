"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CLOSE_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "Never", days: 0 },
];

export default function NewPollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const closesInDays = Number(form.get("closes_in"));
    const closesAt =
      closesInDays > 0
        ? new Date(
            Date.now() + closesInDays * 24 * 60 * 60 * 1000
          ).toISOString()
        : null;

    const body = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      start_date: form.get("start_date") as string,
      num_days: Number(form.get("num_days")),
      start_hour: Number(form.get("start_hour")),
      end_hour: Number(form.get("end_hour")),
      show_dates: form.get("days_only") !== "on",
      closes_at: closesAt,
    };

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create poll");
      setLoading(false);
      return;
    }

    const { slug } = await res.json();
    router.push(`/p/${slug}?created=1`);
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Create a new poll
      </h1>
      <p className="text-sm text-[#6B7280] mb-8">
        Set up the date range and time window, then share the link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            name="title"
            required
            placeholder="e.g. Weekly planning sync"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description{" "}
            <span className="text-[#6B7280] font-normal">(optional)</span>
          </label>
          <textarea
            name="description"
            rows={2}
            placeholder="Add context about this poll…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Start date *
            </label>
            <input
              type="date"
              name="start_date"
              required
              defaultValue={todayStr}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Number of days
            </label>
            <input
              type="number"
              name="num_days"
              min={1}
              max={14}
              defaultValue={7}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Earliest hour
            </label>
            <select
              name="start_hour"
              defaultValue={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0
                    ? "12 AM"
                    : i < 12
                    ? `${i} AM`
                    : i === 12
                    ? "12 PM"
                    : `${i - 12} PM`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Latest hour
            </label>
            <select
              name="end_hour"
              defaultValue={22}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0
                    ? "12 AM"
                    : i < 12
                    ? `${i} AM`
                    : i === 12
                    ? "12 PM"
                    : `${i - 12} PM`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Closes in</label>
          <select
            name="closes_in"
            defaultValue={7}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
          >
            {CLOSE_OPTIONS.map((opt) => (
              <option key={opt.days} value={opt.days}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5">
          <input
            id="days_only"
            name="days_only"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1F3057] focus:ring-[#1F3057]"
          />
          <label htmlFor="days_only" className="text-sm">
            <span className="font-medium">Show days of the week only</span>
            <span className="block text-[#6B7280]">
              Hide calendar dates and label columns Mon–Sun (good for recurring
              weekly plans).
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#111827] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F3057] transition-colors disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create poll"}
        </button>
      </form>
    </div>
  );
}
