import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/csv";
import { Respondent } from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: poll } = await supabase
    .from("polls")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  const { data: respondents } = await supabase
    .from("respondents")
    .select("*")
    .eq("poll_id", poll.id)
    .order("created_at");

  if (!respondents || respondents.length === 0) {
    return new Response("No responses yet", { status: 200 });
  }

  const respondentIds = respondents.map((r) => r.id);
  const { data: availability } = await supabase
    .from("availability")
    .select("respondent_id, slot_utc")
    .in("respondent_id", respondentIds);

  const respondentMap = new Map(respondents.map((r) => [r.id, r]));
  const csvRows = (availability || []).map((a) => {
    const r = respondentMap.get(a.respondent_id)!;
    return {
      name: r.name,
      email: r.email,
      timezone: r.timezone,
      slot_utc: a.slot_utc,
    };
  });

  const csv = buildCsv(respondents as Respondent[], csvRows);
  const filename = `${poll.title.replace(/[^a-zA-Z0-9]/g, "_")}_availability.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
