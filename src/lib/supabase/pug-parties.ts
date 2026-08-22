import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type PugPartyRow = Database["public"]["Tables"]["pug_parties"]["Row"];
export type PugPartyMemberRow = Database["public"]["Tables"]["pug_party_members"]["Row"];

export type PartyMemberProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  pug_elo: number;
};

export type ActiveParty = {
  party: PugPartyRow;
  members: PartyMemberProfile[];
};

/** The party the user is an active member of, if any — a player is only
 * ever in one active party at a time (enforced in app logic, not the DB). */
export async function getActiveParty(userId: string): Promise<ActiveParty | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("pug_party_members")
    .select("party_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return null;

  const { data: party } = await supabase
    .from("pug_parties")
    .select("*")
    .eq("id", membership.party_id)
    .maybeSingle();

  if (!party) return null;

  const { data: memberRows } = await supabase
    .from("pug_party_members")
    .select("user_id")
    .eq("party_id", party.id)
    .eq("status", "active");

  const memberIds = (memberRows ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, pug_elo")
    .in("id", memberIds);

  return { party, members: profiles ?? [] };
}

export type PartyInvite = PugPartyMemberRow & {
  party: PugPartyRow | null;
  leader: PartyMemberProfile | null;
};

export async function getPartyInvites(userId: string): Promise<PartyInvite[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("pug_party_members")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "invited")
    .order("joined_at", { ascending: false });

  const rows = invites ?? [];
  if (rows.length === 0) return [];

  const { data: parties } = await supabase
    .from("pug_parties")
    .select("*")
    .in(
      "id",
      rows.map((r) => r.party_id),
    );
  const partyById = new Map((parties ?? []).map((p) => [p.id, p]));

  const leaderIds = [...partyById.values()].map((p) => p.leader_id);
  const { data: leaders } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, pug_elo")
    .in("id", leaderIds);
  const leaderById = new Map((leaders ?? []).map((p) => [p.id, p]));

  return rows.map((r) => {
    const party = partyById.get(r.party_id) ?? null;
    return { ...r, party, leader: party ? (leaderById.get(party.leader_id) ?? null) : null };
  });
}

/** Friends of `userId` who aren't already in this party (any status). */
export async function getInvitableFriendsForParty(
  partyId: string,
  userId: string,
): Promise<{ id: string; username: string; display_name: string }[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: friendRows } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const friendIds = (friendRows ?? []).map((r) =>
    r.requester_id === userId ? r.addressee_id : r.requester_id,
  );
  if (friendIds.length === 0) return [];

  const { data: existingMembers } = await supabase
    .from("pug_party_members")
    .select("user_id")
    .eq("party_id", partyId)
    .in("user_id", friendIds);

  const alreadyIn = new Set((existingMembers ?? []).map((m) => m.user_id));
  const candidateIds = friendIds.filter((id) => !alreadyIn.has(id));
  if (candidateIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", candidateIds);

  return profiles ?? [];
}
