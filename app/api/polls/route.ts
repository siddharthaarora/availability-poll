import { supabase } from "@/lib/supabase";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8
);

export async function POST(request: Request) {
  const body = await request.json();

  const { title, description, start_date, num_days, start_hour, end_hour, show_dates, closes_at } = body;

  if (!title || !start_date) {
    return Response.json({ error: "Title and start date are required" }, { status: 400 });
  }

  const slug = nanoid();

  const { error } = await supabase.from("polls").insert({
    slug,
    title,
    description: description || null,
    start_date,
    num_days: num_days || 7,
    start_hour: start_hour ?? 8,
    end_hour: end_hour ?? 22,
    show_dates: show_dates ?? true,
    closes_at: closes_at || null,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ slug });
}
