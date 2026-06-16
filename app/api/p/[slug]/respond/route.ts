import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { name, email, timezone, slots } = body;

  if (!name || !email || !timezone || !Array.isArray(slots)) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const emailLower = email.toLowerCase().trim();

  const { data: poll } = await supabase
    .from("polls")
    .select("id, closes_at")
    .eq("slug", slug)
    .single();

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
    return Response.json({ error: "This poll is closed" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("respondents")
    .select("id")
    .eq("poll_id", poll.id)
    .eq("email", emailLower)
    .single();

  if (existing) {
    await supabase
      .from("availability")
      .delete()
      .eq("respondent_id", existing.id);
    await supabase.from("respondents").delete().eq("id", existing.id);
  }

  const { data: respondent, error: rErr } = await supabase
    .from("respondents")
    .insert({
      poll_id: poll.id,
      name: name.trim(),
      email: emailLower,
      timezone,
    })
    .select("id")
    .single();

  if (rErr || !respondent) {
    return Response.json(
      { error: rErr?.message || "Failed to save respondent" },
      { status: 500 }
    );
  }

  if (slots.length > 0) {
    const rows = slots.map((slot_utc: string) => ({
      respondent_id: respondent.id,
      slot_utc,
    }));

    const { error: aErr } = await supabase.from("availability").insert(rows);

    if (aErr) {
      return Response.json({ error: aErr.message }, { status: 500 });
    }
  }

  return Response.json({ ok: true });
}
