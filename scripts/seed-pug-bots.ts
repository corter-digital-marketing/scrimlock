/**
 * One-off: creates 11 bot accounts and queues them solo into NA so a
 * real account queueing as the 12th instantly forms a match. Does NOT
 * clean up after itself — these are meant to sit in the live queue
 * until a real player completes the match. Run scripts/unseed-pug-bots.ts
 * (or manually delete users with username like 'pugbot%') to remove them.
 *
 * Run with: npx tsx scripts/seed-pug-bots.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REGION = "NA";
const BOT_COUNT = 11;
// Below the 999 the real test account was bumped to, so it stays lobby maker.
const ELOS = [850, 780, 700, 650, 600, 550, 500, 450, 400, 350, 300];

const admin = createClient<Database>(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log(`Seeding ${BOT_COUNT} PUG bots into ${REGION}...`);

  for (let i = 1; i <= BOT_COUNT; i++) {
    const email = `pugbot${i}@mailinator.com`;
    const username = `pugbot${i}`;
    const elo = ELOS[i - 1];

    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password: "PugBotPassword123",
      email_confirm: true,
    });
    if (userError || !userData.user) {
      console.error(`  Bot ${i}: createUser failed — ${userError?.message}`);
      continue;
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ username, display_name: `PUG Bot ${i}`, pug_elo: elo })
      .eq("id", userData.user.id);
    if (profileError) {
      console.error(`  Bot ${i}: profile update failed — ${profileError.message}`);
      continue;
    }

    const { error: queueError } = await admin.from("pug_queue_entries").insert({
      region: REGION,
      leader_id: userData.user.id,
      party_id: null,
      user_ids: [userData.user.id],
      size: 1,
      elo,
    });
    if (queueError) {
      console.error(`  Bot ${i}: queue insert failed — ${queueError.message}`);
      continue;
    }

    console.log(`  Bot ${i} (${username}, ${elo} ELO) queued in ${REGION}.`);
  }

  console.log("\nDone. 11 bots are now sitting in the NA queue.");
  console.log("Queue up on your real account and a match should form immediately.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
