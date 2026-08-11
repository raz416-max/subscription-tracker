import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role: needed to read all users/subscriptions
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only Vercel Cron (using our secret) should be able to trigger this
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 1. Get all premium users and their reminder_days setting
  const { data: premiumProfiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, reminder_days")
    .eq("plan", "premium");

  if (profileErr) {
    console.error(profileErr);
    return res.status(500).json({ error: "Failed to load profiles" });
  }

  if (!premiumProfiles?.length) {
    return res.status(200).json({ sent: 0, failed: 0, note: "No premium users" });
  }

  let sent = 0;
  let failed = 0;

  for (const profile of premiumProfiles) {
    // 2. Find this user's subscriptions renewing exactly reminder_days from today
    const { data: subs, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, name, price, cycle, next_date")
      .eq("user_id", profile.id);

    if (subsErr) {
      console.error(subsErr);
      continue;
    }

    const today = new Date();