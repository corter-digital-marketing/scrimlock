/**
 * Removes every account seeded by seed-pug-bots.ts (username like
 * 'pugbot%'), plus any queue entry, party, or match still referencing
 * one — same delete-order lesson as smoke-test.ts: pug_queue_entries
 * (matched_into) and pug_matches (lobby_maker_id) have no cascade from
 * profiles, so they have to go before the users do.
 *
 * Run with: npx tsx scripts/unseed-pug-bots.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient<Database>(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: bots } = await admin
    .from("profiles")
    .select("id, username")
    .like("username", "pugbot%");

  if (!bots || bots.length === 0) {
    console.log("No pugbot accounts found — nothing to clean up.");
    return;
  }

  const ids = bots.map((b) => b.id);
  console.log(`Found ${bots.length} bot accounts: ${bots.map((b) => b.username).join(", ")}`);

  const { data: queueEntries } = await admin
    .from("pug_queue_entries")
    .select("id")
    .in("leader_id", ids);
  if (queueEntries?.length) {
    const { error } = await admin
      .from("pug_queue_entries")
      .delete()
      .in("id", queueEntries.map((q) => q.id));
    if (error) console.warn("  failed to delete queue entries:", error.message);
    else console.log(`  removed ${queueEntries.length} queue entries`);
  }

  const { data: matches } = await admin.from("pug_matches").select("id").in("lobby_maker_id", ids);
  if (matches?.length) {
    const { error } = await admin.from("pug_matches").delete().in("id", matches.map((m) => m.id));
    if (error) console.warn("  failed to delete matches:", error.message);
    else console.log(`  removed ${matches.length} matches (lobby-maker'd by a bot)`);
  }

  const { data: parties } = await admin.from("pug_parties").select("id").in("leader_id", ids);
  if (parties?.length) {
    const { error } = await admin.from("pug_parties").delete().in("id", parties.map((p) => p.id));
    if (error) console.warn("  failed to delete parties:", error.message);
    else console.log(`  removed ${parties.length} parties`);
  }

  let deleted = 0;
  for (const bot of bots) {
    const { error } = await admin.auth.admin.deleteUser(bot.id);
    if (error) {
      console.warn(`  failed to delete ${bot.username}: ${error.message}`);
    } else {
      deleted++;
    }
  }
  console.log(`Deleted ${deleted}/${bots.length} bot accounts.`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
