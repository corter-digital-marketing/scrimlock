"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { tryResolveMatch } from "@/lib/pug-resolver";

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

export async function postLobbyCodeAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const matchId = formData.get("matchId");
  const lobbyCode = formData.get("lobbyCode");
  if (typeof matchId !== "string" || typeof lobbyCode !== "string" || !lobbyCode.trim()) {
    return { error: "Paste the lobby code." };
  }
  if (lobbyCode.length > 100) return { error: "That doesn't look like a lobby code." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: match } = await supabase
    .from("pug_matches")
    .select("lobby_maker_id")
    .eq("id", matchId)
    .maybeSingle();
  if (match?.lobby_maker_id !== user.id) {
    return { error: "Only the lobby maker can post the code." };
  }

  const { error } = await supabase
    .from("pug_matches")
    .update({ lobby_code: lobbyCode.trim(), status: "in_progress" })
    .eq("id", matchId);

  if (error) return { error: "Couldn't save the code. Please try again." };

  revalidatePath(`/pug/${matchId}`);
}

export async function voteAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const matchId = formData.get("matchId");
  const team = formData.get("team");
  if (typeof matchId !== "string" || (team !== "1" && team !== "2")) {
    return { error: "Invalid vote." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: isPlayer } = await supabase
    .from("pug_match_players")
    .select("id")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isPlayer) return { error: "Only players in this match can vote." };

  const { error } = await supabase
    .from("pug_match_votes")
    .insert({ match_id: matchId, voter_id: user.id, voted_team: Number(team) });

  if (error) {
    return error.code === "23505"
      ? { error: "You've already voted." }
      : { error: "Couldn't record your vote. Please try again." };
  }

  await tryResolveMatch(matchId);
  revalidatePath(`/pug/${matchId}`);
}
