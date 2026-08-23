"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { tryFormMatch } from "@/lib/pug-matchmaker";
import { isPugRegion } from "@/lib/pug-regions";

export type SimpleActionResult = { error?: string } | void;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function isInActiveMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
) {
  const { data: playerRows } = await supabase
    .from("pug_match_players")
    .select("match_id")
    .in("user_id", userIds);

  const matchIds = [...new Set((playerRows ?? []).map((r) => r.match_id))];
  if (matchIds.length === 0) return false;

  const { data: unresolved } = await supabase
    .from("pug_matches")
    .select("id")
    .in("id", matchIds)
    .neq("status", "completed")
    .limit(1);

  return (unresolved?.length ?? 0) > 0;
}

/** After a match forms, sends whoever's part of it straight there;
 * otherwise just leaves them queued and refreshes the page. */
async function afterMatchmaking(region: string, userId: string) {
  const matchId = await tryFormMatch(region);
  revalidatePath("/pug");
  if (!matchId) return;

  const supabase = await createClient();
  const { data: playerRow } = await supabase
    .from("pug_match_players")
    .select("id")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .maybeSingle();

  if (playerRow) redirect(`/pug/${matchId}`);
}

export async function joinSoloQueueAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const region = formData.get("region");
  if (!isPugRegion(region)) return { error: "Pick a region." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: activeParty } = await supabase
    .from("pug_party_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (activeParty) return { error: "Leave your party to queue solo." };

  const { data: existing } = await supabase
    .from("pug_queue_entries")
    .select("id")
    .eq("leader_id", user.id)
    .eq("status", "queued")
    .maybeSingle();
  if (existing) return { error: "You're already queued." };

  if (await isInActiveMatch(supabase, [user.id])) {
    return { error: "Finish your current match first." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pug_elo")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("pug_queue_entries").insert({
    region,
    leader_id: user.id,
    party_id: null,
    user_ids: [user.id],
    size: 1,
    elo: profile?.pug_elo ?? 0,
  });

  if (error) return { error: "Couldn't join the queue. Please try again." };

  await afterMatchmaking(region, user.id);
}

export async function joinPartyQueueAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const partyId = formData.get("partyId");
  if (typeof partyId !== "string") return { error: "Missing party." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: party } = await supabase
    .from("pug_parties")
    .select("*")
    .eq("id", partyId)
    .maybeSingle();
  if (party?.leader_id !== user.id) {
    return { error: "Only the party leader can queue the party." };
  }

  const { data: memberRows } = await supabase
    .from("pug_party_members")
    .select("user_id")
    .eq("party_id", partyId)
    .eq("status", "active");
  const memberIds = (memberRows ?? []).map((m) => m.user_id);

  if (memberIds.length > 6) return { error: "A party can't be bigger than 6." };

  const { data: existing } = await supabase
    .from("pug_queue_entries")
    .select("id")
    .eq("leader_id", user.id)
    .eq("status", "queued")
    .maybeSingle();
  if (existing) return { error: "This party is already queued." };

  if (await isInActiveMatch(supabase, memberIds)) {
    return { error: "Someone in your party still has a match to finish." };
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("pug_elo")
    .in("id", memberIds);
  const avgElo =
    (profiles ?? []).reduce((sum, p) => sum + p.pug_elo, 0) / (profiles?.length || 1);

  const { error } = await supabase.from("pug_queue_entries").insert({
    region: party.region,
    leader_id: user.id,
    party_id: partyId,
    user_ids: memberIds,
    size: memberIds.length,
    elo: avgElo,
  });

  if (error) return { error: "Couldn't queue the party. Please try again." };

  await afterMatchmaking(party.region, user.id);
}

export async function leaveQueueAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const entryId = formData.get("entryId");
  if (typeof entryId !== "string") return { error: "Missing queue entry." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  await supabase.from("pug_queue_entries").delete().eq("id", entryId).eq("leader_id", user.id);

  revalidatePath("/pug");
}
