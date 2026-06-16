"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Poll, Respondent, Availability } from "@/lib/schema";
import { getBrowserTimezone } from "@/lib/timezones";
import WeekGrid, { slotKeyToUtc } from "@/components/WeekGrid";
import HeatmapGrid from "@/components/HeatmapGrid";
import ParticipantForm from "@/components/ParticipantForm";
import TimeFormatToggle from "@/components/TimeFormatToggle";
import ViewToggle from "@/components/ViewToggle";
import TimezoneSelector from "@/components/TimezoneSelector";
import CopyShareButton from "@/components/CopyShareButton";
import DownloadCsvButton from "@/components/DownloadCsvButton";

function utcToSlotKey(
  slotUtc: string,
  startDate: string,
  numDays: number,
  startHour: number,
  endHour: number,
  _timezone: string
): string | null {
  const d = new Date(slotUtc);
  const start = new Date(startDate + "T00:00:00Z");
  const dayIndex = Math.floor(
    (d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
  );
  const hour = d.getUTCHours();
  if (dayIndex < 0 || dayIndex >= numDays) return null;
  if (hour < startHour || hour >= endHour) return null;
  return `${dayIndex}-${hour}`;
}

export default function PollPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const justCreated = searchParams.get("created") === "1";

  const [poll, setPoll] = useState<Poll | null>(null);
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const [view, setView] = useState<"selection" | "results">("selection");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState(() => getBrowserTimezone());
  const [use24Hour, setUse24Hour] = useState(false);
  const [viewTimezone, setViewTimezone] = useState(() => getBrowserTimezone());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored24 = localStorage.getItem("sarbat-24h");
    if (stored24 !== null) setUse24Hour(stored24 === "true");
    const storedTz = localStorage.getItem("sarbat-tz");
    if (storedTz) {
      setTimezone(storedTz);
      setViewTimezone(storedTz);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sarbat-24h", String(use24Hour));
  }, [use24Hour]);

  useEffect(() => {
    localStorage.setItem("sarbat-tz", viewTimezone);
  }, [viewTimezone]);

  useEffect(() => {
    async function load() {
      const { data: pollData } = await supabase
        .from("polls")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!pollData) {
        setLoading(false);
        return;
      }

      setPoll(pollData);

      const { data: respData } = await supabase
        .from("respondents")
        .select("*")
        .eq("poll_id", pollData.id);

      setRespondents(respData || []);

      if (respData && respData.length > 0) {
        const ids = respData.map((r) => r.id);
        const { data: availData } = await supabase
          .from("availability")
          .select("*")
          .in("respondent_id", ids);
        setAvailability(availData || []);
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!poll) return;

    const channel = supabase
      .channel(`poll-${poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability",
        },
        async () => {
          const { data: respData } = await supabase
            .from("respondents")
            .select("*")
            .eq("poll_id", poll.id);
          setRespondents(respData || []);

          if (respData && respData.length > 0) {
            const ids = respData.map((r) => r.id);
            const { data: availData } = await supabase
              .from("availability")
              .select("*")
              .in("respondent_id", ids);
            setAvailability(availData || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll]);

  const isClosed = poll?.closes_at
    ? new Date(poll.closes_at) < new Date()
    : false;

  const slotCounts = useMemo(() => {
    if (!poll) return new Map();

    const respondentMap = new Map(respondents.map((r) => [r.id, r]));
    const counts = new Map<string, { count: number; names: string[] }>();

    for (const a of availability) {
      const key = utcToSlotKey(
        a.slot_utc,
        poll.start_date,
        poll.num_days,
        poll.start_hour,
        poll.end_hour,
        viewTimezone
      );
      if (!key) continue;
      const existing = counts.get(key) || { count: 0, names: [] };
      const resp = respondentMap.get(a.respondent_id);
      existing.count++;
      if (resp) existing.names.push(resp.name);
      counts.set(key, existing);
    }

    return counts;
  }, [poll, respondents, availability, viewTimezone]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const { count } of slotCounts.values()) {
      if (count > max) max = count;
    }
    return max;
  }, [slotCounts]);

  const bestSlots = useMemo(() => {
    if (maxCount === 0) return [];
    const best: { key: string; names: string[] }[] = [];
    for (const [key, data] of slotCounts) {
      if (data.count === maxCount) best.push({ key, names: data.names });
    }
    return best;
  }, [slotCounts, maxCount]);

  const handleSelectAll = useCallback(() => {
    if (!poll) return;
    const hours = Array.from(
      { length: poll.end_hour - poll.start_hour },
      (_, i) => poll.start_hour + i
    );
    const days = Array.from({ length: poll.num_days }, (_, i) => i);
    const all = new Set<string>();
    for (const d of days) {
      for (const h of hours) {
        all.add(`${d}-${h}`);
      }
    }
    setSelected(all);
  }, [poll]);

  const handleUnselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  async function handleSubmit() {
    if (!poll || !name.trim() || !email.trim()) {
      setToast("Please fill in your name and email.");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setSubmitting(true);

    const slots = Array.from(selected).map((key) =>
      slotKeyToUtc(key, poll.start_date, timezone)
    );

    const res = await fetch(`/api/p/${slug}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email, timezone, slots }),
    });

    setSubmitting(false);

    if (res.ok) {
      setView("results");
      setToast("Thanks, your availability is in!");
      setTimeout(() => setToast(""), 3000);
    } else {
      const data = await res.json();
      setToast(data.error || "Failed to submit");
      setTimeout(() => setToast(""), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-[#6B7280]">
        Loading…
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex items-center justify-center py-32 text-[#6B7280]">
        Poll not found.
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {justCreated && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-green-800">
            Poll created! Share this link with your group:
          </span>
          <code className="text-sm bg-white rounded px-2 py-0.5 border border-green-200 text-green-900 flex-shrink-0">
            {shareUrl}
          </code>
          <CopyShareButton url={shareUrl} />
        </div>
      )}

      {isClosed && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          This poll is closed. You can still view the results below.
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
          <h1 className="text-xl font-semibold tracking-tight flex-1">
            {poll.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-[#6B7280]">
              {respondents.length} participant
              {respondents.length !== 1 ? "s" : ""}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isClosed
                  ? "bg-amber-100 text-amber-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {isClosed ? "Closed" : "Live"}
            </span>
          </div>
        </div>
        {poll.description && (
          <p className="text-sm text-[#6B7280]">{poll.description}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 flex-wrap">
        {!isClosed && (
          <ViewToggle view={view} onChange={setView} />
        )}
        <TimeFormatToggle use24Hour={use24Hour} onChange={setUse24Hour} />
        <div className="w-64">
          <TimezoneSelector value={viewTimezone} onChange={setViewTimezone} />
        </div>
        {!justCreated && <CopyShareButton url={shareUrl} />}
      </div>

      {view === "selection" && !isClosed ? (
        <div>
          <div className="mb-6">
            <ParticipantForm
              name={name}
              email={email}
              timezone={timezone}
              onNameChange={setName}
              onEmailChange={setEmail}
              onTimezoneChange={setTimezone}
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-[#6B7280] hover:bg-gray-50 transition-colors"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={handleUnselectAll}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-[#6B7280] hover:bg-gray-50 transition-colors"
            >
              Unselect all
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-[#111827] px-5 py-2 text-sm font-medium text-white hover:bg-[#1F3057] transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Selection"}
            </button>
          </div>

          <WeekGrid
            startDate={poll.start_date}
            numDays={poll.num_days}
            startHour={poll.start_hour}
            endHour={poll.end_hour}
            timezone={timezone}
            use24Hour={use24Hour}
            selected={selected}
            onSelectionChange={setSelected}
          />

          <div className="mt-4 space-y-1 text-xs text-[#9CA3AF]">
            <p>Click and drag cells to select multiple cells at once.</p>
            <p>
              Click a date to select the entire column, or a time to select the
              entire row.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {respondents.length === 0 ? (
            <div className="py-16 text-center text-[#6B7280]">
              <p className="text-lg font-medium mb-1">
                Be the first to respond
              </p>
              <p className="text-sm">
                Switch to the Selection view to add your availability.
              </p>
            </div>
          ) : (
            <>
              {bestSlots.length > 0 && (
                <div className="mb-4 rounded-lg bg-[#1F3057]/5 border border-[#1F3057]/10 px-4 py-3">
                  <div className="text-sm font-medium text-[#1F3057] mb-1">
                    Best fit — {maxCount} available
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    {bestSlots
                      .slice(0, 3)
                      .map((s) => s.names.join(", "))
                      .join(" | ")}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1" />
                <DownloadCsvButton slug={slug} />
              </div>

              <HeatmapGrid
                startDate={poll.start_date}
                numDays={poll.num_days}
                startHour={poll.start_hour}
                endHour={poll.end_hour}
                use24Hour={use24Hour}
                slotCounts={slotCounts}
                maxCount={maxCount}
              />

              <div className="mt-6 flex flex-wrap gap-2">
                {respondents.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center rounded-full bg-[#1F3057] px-3 py-1 text-xs text-white"
                  >
                    {r.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-[#111827] px-4 py-2.5 text-sm text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
