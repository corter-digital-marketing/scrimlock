"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type MessageActionState = { error?: string } | null;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";

const MAX_MESSAGE_LENGTH = 2000;

export async function sendMessageAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const recipientId = formData.get("recipientId");
  const recipientUsername = formData.get("recipientUsername");
  const body = formData.get("body");

  if (typeof recipientId !== "string") return { error: "Missing recipient." };
  if (typeof body !== "string" || !body.trim()) return { error: "Message can't be empty." };
  if (body.length > MAX_MESSAGE_LENGTH) {
    return { error: `${MAX_MESSAGE_LENGTH} characters max.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (user.id === recipientId) return { error: "You can't message yourself." };

  const [userAId, userBId] =
    user.id < recipientId ? [user.id, recipientId] : [recipientId, user.id];

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a_id", userAId)
    .eq("user_b_id", userBId)
    .maybeSingle();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({ user_a_id: userAId, user_b_id: userBId })
      .select("id")
      .single();

    if (createError || !created) {
      return { error: "Couldn't start the conversation. Please try again." };
    }
    conversationId = created.id;
  }

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: body.trim() });

  if (error) {
    return { error: "Couldn't send that message. Please try again." };
  }

  revalidatePath("/messages");
  if (typeof recipientUsername === "string") {
    revalidatePath(`/messages/${recipientUsername}`);
  }
  return null;
}
