import { Respondent } from "./schema";
import { getTimezoneAbbr } from "./timezones";

interface CsvRow {
  name: string;
  email: string;
  timezone: string;
  slot_utc: string;
}

function escCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatLocalSlot(utcIso: string, tz: string): string {
  const d = new Date(utcIso);
  const dateStr = d.toLocaleDateString("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeStr = d.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const abbr = getTimezoneAbbr(tz, d);
  return `${dateStr} ${timeStr} ${abbr}`;
}

export function buildCsv(
  respondents: Respondent[],
  rows: CsvRow[]
): string {
  const lines: string[] = [];

  lines.push("# All Respondents");
  lines.push("name,email,timezone,submitted_at");
  for (const r of respondents) {
    lines.push(
      [escCsv(r.name), escCsv(r.email), escCsv(r.timezone), r.created_at].join(
        ","
      )
    );
  }
  lines.push("");

  lines.push("# Availability");
  lines.push("name,email,timezone,slot_local,slot_utc");
  for (const row of rows) {
    const localSlot = formatLocalSlot(row.slot_utc, row.timezone);
    lines.push(
      [
        escCsv(row.name),
        escCsv(row.email),
        escCsv(row.timezone),
        escCsv(localSlot),
        row.slot_utc,
      ].join(",")
    );
  }

  return lines.join("\n");
}
