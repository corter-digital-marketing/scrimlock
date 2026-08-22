"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SimpleActionResult = { error?: string } | void;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";
const MAX_PARTY_SIZE = 6;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function hasActiveParty(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("pug_party_members")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

export async function createPartyAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const region = formData.get("region");
  if (typeof region !== "string" || !region) return { error: "Pick a region." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  if (await hasActiveParty(supabase, user.id)) {
    return { error: "You're already in a party." };
  }

  const { error } = await supabase.from("pug_parties").insert({
    leader_id: user.id,
    region,
  });

  if (error) return { error: "Couldn't create a party. Please try again." };

  revalidatePath("/pug");
}

export async function inviteToPartyAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const partyId = formData.get("partyId");
  const inviteeId = formData.get("inviteeId");
  if (typeof partyId !== "string" || typeof inviteeId !== "string") {
    return { error: "Missing party or friend." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: party } = await supabase
    .from("pug_parties")
    .select("leader_id")
    .eq("id", partyId)
    .maybeSingle();
  if (party?.leader_id !== user.id) {
    return { error: "Only the party leader can invite." };
  }

  const { count } = await supabase
    .from("pug_party_members")
    .select("id", { count: "exact", head: true })
    .eq("party_id", partyId);
  if ((count ?? 0) >= MAX_PARTY_SIZE) {
    return { error: `Party is full (${MAX_PARTY_SIZE} max).` };
  }

  const { error } = await supabase
    .from("pug_party_members")
    .insert({ party_id: partyId, user_id: inviteeId, status: "invited" });

  if (error) {
    return error.code === "23505"
      ? { error: "They're already invited or in the party." }
      : { error: "Couldn't send the invite. Please try again." };
  }

  revalidatePath("/pug");
}

export async function acceptPartyInviteAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const partyId = formData.get("partyId");
  if (typeof partyId !== "string") return { error: "Missing party." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  if (await hasActiveParty(supabase, user.id)) {
    return { error: "Leave your current party first." };
  }

  const { count } = await supabase
    .from("pug_party_members")
    .select("id", { count: "exact", head: true })
    .eq("party_id", partyId);
  if ((count ?? 0) >= MAX_PARTY_SIZE) {
    return { error: `Party is full (${MAX_PARTY_SIZE} max).` };
  }

  await supabase
    .from("pug_party_members")
    .update({ status: "active" })
    .eq("party_id", partyId)
    .eq("user_id", user.id)
    .eq("status", "invited");

  revalidatePath("/pug");
}

/** Covers leaving an active party, declining an invite, and — if the
 * leader is the one leaving — disbanding the whole party. */
export async function leavePartyAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const partyId = formData.get("partyId");
  if (typeof partyId !== "string") return { error: "Missing party." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: party } = await supabase
    .from("pug_parties")
    .select("leader_id")
    .eq("id", partyId)
    .maybeSingle();

  if (party?.leader_id === user.id) {
    await supabase.from("pug_parties").delete().eq("id", partyId);
  } else {
    await supabase
      .from("pug_party_members")
      .delete()
      .eq("party_id", partyId)
      .eq("user_id", user.id);
  }

  revalidatePath("/pug");
}

export async function removePartyMemberAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const partyId = formData.get("partyId");
  const memberId = formData.get("memberId");
  if (typeof partyId !== "string" || typeof memberId !== "string") {
    return { error: "Missing party or member." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: party } = await supabase
    .from("pug_parties")
    .select("leader_id")
    .eq("id", partyId)
    .maybeSingle();
  if (party?.leader_id !== user.id) {
    return { error: "Only the party leader can remove members." };
  }

  await supabase
    .from("pug_party_members")
    .delete()
    .eq("party_id", partyId)
    .eq("user_id", memberId);

  revalidatePath("/pug");
}
