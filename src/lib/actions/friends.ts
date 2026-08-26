"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { searchPlayers, type PlayerSearchResult } from "@/lib/supabase/friends";

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

/**
 * Called directly from FriendSearch's onChange (debounced client-side),
 * not bound to a form — Server Actions don't have to be form actions.
 */
export async function searchPlayersAction(query: string): Promise<PlayerSearchResult[]> {
  if (!isSupabaseConfigured()) return [];
  const { user } = await requireUser();
  if (!user) return [];
  return searchPlayers(user.id, query);
}

export async function sendFriendRequestAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const addresseeId = formData.get("addresseeId");
  const profileUsername = formData.get("profileUsername");
  if (typeof addresseeId !== "string") return { error: "Missing user." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (user.id === addresseeId) return { error: "You can't friend yourself." };

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: addresseeId });

  if (error) {
    return error.code === "23505"
      ? { error: "A request already exists between you two." }
      : { error: "Couldn't send that request. Please try again." };
  }

  if (typeof profileUsername === "string") revalidatePath(`/profile/${profileUsername}`);
}

export async function acceptFriendRequestAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const friendshipId = formData.get("friendshipId");
  if (typeof friendshipId !== "string") return { error: "Missing request." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  revalidatePath("/friends");
}

export async function removeFriendshipAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const friendshipId = formData.get("friendshipId");
  const profileUsername = formData.get("profileUsername");
  if (typeof friendshipId !== "string") return { error: "Missing request." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  await supabase.from("friendships").delete().eq("id", friendshipId);

  revalidatePath("/friends");
  if (typeof profileUsername === "string") revalidatePath(`/profile/${profileUsername}`);
}
