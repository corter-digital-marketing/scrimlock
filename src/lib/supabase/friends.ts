import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type FriendshipRow = Database["public"]["Tables"]["friendships"]["Row"];
export type FriendProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

/** The relationship (if any) between two users, from `viewerId`'s side. */
export async function getFriendship(
  userId: string,
  otherId: string,
): Promise<FriendshipRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`,
    )
    .maybeSingle();

  return data ?? null;
}

/** Accepted friends, with their profile summary — for a profile's friends list. */
export async function getFriends(userId: string): Promise<FriendProfile[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const friendIds = (rows ?? []).map((r) =>
    r.requester_id === userId ? r.addressee_id : r.requester_id,
  );
  if (friendIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", friendIds);

  return profiles ?? [];
}

/** Incoming pending requests — for the friend-requests inbox. */
export async function getIncomingFriendRequests(
  userId: string,
): Promise<(FriendshipRow & { requester: FriendProfile | null })[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("*")
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const requests = rows ?? [];
  if (requests.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in(
      "id",
      requests.map((r) => r.requester_id),
    );

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return requests.map((r) => ({ ...r, requester: byId.get(r.requester_id) ?? null }));
}
